import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../../store/auth/authContext";
import { ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";

// After this many failed attempts we surface a "you may be locked out
// soon" banner. Server-side rate-limit kicks in at 5/15min per IP, so we
// warn at 3 to give the user a chance to slow down or use forgot-password
// before they hit the actual lockout.
const FAILURE_WARN_THRESHOLD = 3;

export function SignInPage() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  // Set when the server returns 429 — disables the form until the timer
  // expires. Defaults to 15 minutes to match the server window.
  const [lockedUntil, setLockedUntil] = useState(null);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const locked = lockedUntil && Date.now() < lockedUntil;

  const handleSubmit = async () => {
    if (locked) return;
    setTopError(null);
    // Explicitly validate every field (Antd equivalent of form.trigger())
    // so empty/invalid fields surface inline errors on the first submit.
    let values;
    try {
      values = await form.validateFields();
    } catch (errInfo) {
      // Scroll the first invalid field into view so the error message is
      // visible even on short viewports.
      if (errInfo?.errorFields?.length) {
        form.scrollToField(errInfo.errorFields[0].name);
      }
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    try {
      await signin(values);
      setFailedAttempts(0);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setShakeKey((k) => k + 1);
      // Special case: account exists but email isn't verified — offer a path
      // to re-send the verification email rather than just showing an error.
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email", {
          replace: true,
          state: { email: values.email, fromSignin: true },
        });
        return;
      }
      // Server-side rate limit hit — disable the form and stop counting.
      if (err instanceof ApiError && (err.status === 429 || err.code === "RATE_LIMITED")) {
        setLockedUntil(Date.now() + 15 * 60 * 1000);
        setTopError(
          err.message ||
            "Too many sign-in attempts. Try again in a few minutes."
        );
        return;
      }
      // Real auth failure (bad credentials, etc.) — bump the counter so the
      // warning banner can appear before the server lockout fires.
      setFailedAttempts((n) => n + 1);
      if (err instanceof ApiError && err.details) {
        form.setFields(
          Object.entries(err.details).map(([name, message]) => ({
            name,
            errors: [message],
          }))
        );
      } else {
        setTopError(err.message || "Could not sign in. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showWarning = !locked && failedAttempts >= FAILURE_WARN_THRESHOLD;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue planning your next adventure."
      footer={
        <div className="flex items-center justify-between">
          <Link
            to="/signup"
            className="text-accent font-medium hover:underline"
          >
            Create an account
          </Link>
          <Link
            to="/forgot-password"
            className="text-fg-muted hover:text-fg hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      }
    >
      <Shake trigger={shakeKey}>
        {topError && (
          <Alert type="error" title={topError} showIcon className="!mb-4" />
        )}

        {locked && (
          <Alert
            type="error"
            showIcon
            icon={<Icon icon="mdi:lock-clock" />}
            title="Sign-in temporarily locked"
            description={
              <span>
                Too many failed attempts from this network. Wait a few
                minutes, or{" "}
                <Link to="/forgot-password" className="font-semibold underline">
                  reset your password
                </Link>{" "}
                if you've forgotten it.
              </span>
            }
            className="!mb-4"
          />
        )}

        {showWarning && (
          <Alert
            type="warning"
            showIcon
            icon={<Icon icon="mdi:shield-alert-outline" />}
            title={`${failedAttempts} failed attempts — you'll be locked out after 5`}
            description={
              <span>
                If you've forgotten your password, use{" "}
                <Link
                  to="/forgot-password"
                  className="font-semibold underline"
                >
                  Forgot password
                </Link>{" "}
                instead of guessing.
              </span>
            }
            className="!mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          onFinishFailed={() => setShakeKey((k) => k + 1)}
          // Errors only appear once the user explicitly submits, instead
          // of yelling at them while they're mid-typing.
          validateTrigger="onSubmit"
          disabled={submitting || locked}
          autoComplete="on"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input size="large" placeholder="you@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Sign in
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
