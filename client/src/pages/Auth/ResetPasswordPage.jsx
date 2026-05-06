import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { PasswordStrengthMeter } from "../../components/ui/PasswordStrengthMeter";
import { Shake } from "../../components/ui/Shake";
import { SuccessCheck } from "../../components/ui/SuccessCheck";
import { scorePassword } from "../../services/auth/passwordStrength";

// Reset flow now uses an OTP. The user arrives here from /forgot-password
// (location.state.email) or via a deep link with ?email=... — we accept
// both. The page collects email + 6-digit code + new password.
export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const [topError, setTopError] = useState(null);
  const [topNotice, setTopNotice] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [devOtp, setDevOtp] = useState(location.state?.devOtp ?? null);

  const presetEmail = location.state?.email || params.get("email") || "";
  const password = Form.useWatch("password", form) || "";

  const onFinish = async ({ email, code, password, confirm }) => {
    setTopError(null);
    setTopNotice(null);
    if (password !== confirm) {
      form.setFields([{ name: "confirm", errors: ["Passwords don't match"] }]);
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword({ email, code, password });
      setDone(true);
    } catch (err) {
      setShakeKey((k) => k + 1);
      if (err instanceof ApiError && err.details) {
        form.setFields(
          Object.entries(err.details).map(([name, message]) => ({
            name,
            errors: [message],
          }))
        );
        setTopError(err.message || "Please fix the highlighted fields.");
      } else {
        setTopError(
          err instanceof ApiError ? err.message : "Could not reset password."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    const email = form.getFieldValue("email");
    if (!email) {
      setTopError("Enter your email above first.");
      return;
    }
    setTopError(null);
    setTopNotice(null);
    setResending(true);
    try {
      const res = await api.forgotPassword(email);
      setTopNotice(
        `If the address is on file, a fresh code is on the way to ${email}.`
      );
      if (res?.devOtp) setDevOtp(res.devOtp);
    } catch (err) {
      setTopError(
        err instanceof ApiError ? err.message : "Could not resend. Try again."
      );
    } finally {
      setResending(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now sign in with your new password."
      >
        <div className="flex flex-col items-center text-center py-2">
          <SuccessCheck size={56} />
          <Button
            type="primary"
            size="large"
            className="!mt-6"
            onClick={() => navigate("/signin", { replace: true })}
          >
            Continue to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        presetEmail
          ? `Enter the 6-digit code we sent to ${presetEmail}, then choose a new password.`
          : "Enter your email, the 6-digit code from your inbox, and a new password."
      }
      footer={
        <Link to="/signin" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Shake trigger={shakeKey}>
        {topError && (
          <Alert type="error" showIcon message={topError} className="!mb-4" />
        )}
        {topNotice && (
          <Alert
            type="success"
            showIcon
            message={topNotice}
            description={
              devOtp ? (
                <span>
                  Dev mode code:{" "}
                  <code className="font-mono font-bold tracking-widest">
                    {devOtp}
                  </code>
                </span>
              ) : null
            }
            className="!mb-4"
          />
        )}
        {!topNotice && devOtp && (
          <Alert
            type="info"
            showIcon
            message="Dev mode"
            description={
              <span>
                Code:{" "}
                <code className="font-mono font-bold tracking-widest">
                  {devOtp}
                </code>
              </span>
            }
            className="!mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          disabled={submitting}
          initialValues={{ email: presetEmail }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input
              size="large"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="6-digit code"
            rules={[
              { required: true, message: "Enter the code from your email" },
              { pattern: /^\d{6}$/, message: "Code must be 6 digits" },
            ]}
          >
            <Input
              size="large"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="!font-mono !tracking-[0.5em] !text-center !text-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="New password"
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "At least 8 characters" },
              {
                validator: (_, v) =>
                  !v || scorePassword(v).score >= 2
                    ? Promise.resolve()
                    : Promise.reject(new Error("Choose a stronger password")),
              },
            ]}
            extra={<PasswordStrengthMeter password={password} />}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm" },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || v === getFieldValue("password")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Passwords don't match")),
              }),
            ]}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Update password
          </Button>
        </Form>

        <div className="mt-4 text-center text-sm text-fg-muted">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={resending || submitting}
            className="text-accent font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        </div>
      </Shake>
    </AuthShell>
  );
}
