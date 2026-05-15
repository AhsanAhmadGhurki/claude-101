import { useEffect, useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../../store/auth/authContext";
import { ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";
import { usePageTitle } from "../../hooks/usePageTitle";

// After this many failed attempts we surface a "you may be locked out
// soon" banner. Server-side rate-limit kicks in at 5/15min per IP, so we
// warn at 3 to give the user a chance to slow down or use forgot-password
// before they hit the actual lockout.
const FAILURE_WARN_THRESHOLD = 3;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInPage() {
  usePageTitle("Sign in");
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  // Component-owned error state. We render these as inline <p> elements so
  // visibility doesn't depend on Antd's internal Form.ErrorList rendering
  // (which can be themed away by ConfigProvider tokens). Antd's own rules
  // still run as a second layer — both can coexist without conflict.
  const [errors, setErrors] = useState({});
  // Set when the server returns 429 — disables the form until the timer
  // expires. Defaults to 15 minutes to match the server window.
  const [lockedUntil, setLockedUntil] = useState(null);
  // Re-render tick so the "locked" check stays current as the lockout window
  // counts down. Lives outside the render to keep Date.now() out of the body.
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return undefined;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        clearInterval(id);
      } else {
        forceTick((n) => n + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // The effect above clears `lockedUntil` to null the moment the window
  // expires, so truthiness alone reflects "currently locked" without calling
  // Date.now() in the render body.
  const locked = Boolean(lockedUntil);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  function validate(values) {
    const next = {};
    const email = (values.email ?? "").trim();
    const password = values.password ?? "";
    if (!email) {
      next.email = "Email is required";
    } else if (!EMAIL_RE.test(email)) {
      next.email = "Please enter a valid email address";
    }
    if (!password) {
      next.password = "Password is required";
    }
    return next;
  }

  // Use the button's onClick (not Form's onFinish) so our own validation
  // always runs — Antd's onFinish is suppressed when its internal validation
  // fails, which would silently swallow the click before our handler runs.
  const handleSubmit = async () => {
    if (locked || submitting) return;
    setTopError(null);

    const raw = form.getFieldsValue(["email", "password"]);
    const nextErrors = validate(raw);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setShakeKey((k) => k + 1);
      // Focus the first invalid field so keyboard users can re-type without
      // hunting for the input.
      const firstField = nextErrors.email ? "email" : "password";
      try {
        form.scrollToField(firstField);
      } catch {
        // Antd scroll throws if the field isn't registered yet — ignore.
      }
      return;
    }

    setSubmitting(true);
    try {
      const values = { email: raw.email.trim(), password: raw.password };
      await signin(values);
      setFailedAttempts(0);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setShakeKey((k) => k + 1);
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email", {
          replace: true,
          state: { email: raw.email, fromSignin: true },
        });
        return;
      }
      if (
        err instanceof ApiError &&
        (err.status === 429 || err.code === "RATE_LIMITED")
      ) {
        setLockedUntil(Date.now() + 15 * 60 * 1000);
        setTopError(
          err.message ||
            "Too many sign-in attempts. Try again in a few minutes."
        );
        return;
      }
      setFailedAttempts((n) => n + 1);
      if (err instanceof ApiError && err.details) {
        // Map per-field server errors into our local state so they render
        // alongside any client-side validation messages.
        setErrors((prev) => ({ ...prev, ...err.details }));
      } else {
        setTopError(err.message || "Could not sign in. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Clear a field's error as soon as the user starts editing it so the red
  // ring disappears on the next keystroke.
  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
                if you&apos;ve forgotten it.
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
                If you&apos;ve forgotten your password, use{" "}
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
          // Block native form submission entirely — `handleSubmit` is wired
          // to the button's onClick so our validation runs even when Antd's
          // own Field rules would otherwise swallow the submit event.
          onFinish={(e) => e?.preventDefault?.()}
          disabled={submitting || locked}
          autoComplete="on"
        >
          <Form.Item
            name="email"
            label="Email"
            // help/validateStatus drive Antd's own inline error UI. We feed
            // them from local state so both the controlled ring and Antd's
            // ErrorList are in sync.
            validateStatus={errors.email ? "error" : undefined}
            help={errors.email}
          >
            <Input
              size="large"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              onChange={() => clearFieldError("email")}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            validateStatus={errors.password ? "error" : undefined}
            help={errors.password}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              onChange={() => clearFieldError("password")}
              onPressEnter={handleSubmit}
            />
          </Form.Item>

          <Button
            type="primary"
            // Plain button (not htmlType="submit") so we own the validation
            // flow without fighting Antd's Form.onFinish suppression.
            htmlType="button"
            size="large"
            loading={submitting}
            onClick={handleSubmit}
            block
          >
            Sign in
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
