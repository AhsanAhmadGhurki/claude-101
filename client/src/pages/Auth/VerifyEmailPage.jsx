import { useEffect, useState } from "react";
import { Form, Button, Alert, Input } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { useAuth } from "../../store/auth/authContext";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";
import { SuccessCheck } from "../../components/ui/SuccessCheck";

// Email-verification flow now uses a 6-digit OTP. The user lands here either
// directly after signup (state.email passed by SignUpPage) or by clicking a
// "verify" prompt while signed in (email pulled from useAuth().user). If we
// have neither, we ask them to enter their email so we can target the
// resend / verify calls correctly.
export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const presetEmail = location.state?.email || user?.email || "";

  const [email, setEmail] = useState(presetEmail);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [topError, setTopError] = useState(null);
  const [topNotice, setTopNotice] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [verified, setVerified] = useState(false);

  // If a fresh email was passed via state, prefill it once.
  useEffect(() => {
    if (presetEmail) form.setFieldValue("email", presetEmail);
  }, [presetEmail, form]);

  const onVerify = async ({ email: formEmail, code }) => {
    setTopError(null);
    setTopNotice(null);
    setSubmitting(true);
    try {
      await api.verifyEmail({ email: formEmail, code });
      setEmail(formEmail);
      setVerified(true);
      await refreshUser().catch(() => {}); // pick up isVerified=true if signed in
    } catch (err) {
      setShakeKey((k) => k + 1);
      if (err instanceof ApiError) {
        setTopError(err.message);
      } else {
        setTopError("Could not verify. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    const formEmail = form.getFieldValue("email") || email;
    if (!formEmail) {
      setTopError("Enter your email above first.");
      return;
    }
    setTopError(null);
    setTopNotice(null);
    setResending(true);
    try {
      const res = await api.requestVerifyEmail(formEmail);
      setTopNotice(
        `If the address is on file, a fresh code is on the way to ${formEmail}.`
      );
      if (res?.devOtp) setDevOtp(res.devOtp);
    } catch (err) {
      // Cooldown / rate-limit messages should reach the user verbatim.
      setTopError(
        err instanceof ApiError ? err.message : "Could not resend. Try again."
      );
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <AuthShell
        title="Email verified"
        subtitle="Welcome aboard. Your account is ready to go."
      >
        <div className="flex flex-col items-center text-center py-2">
          <SuccessCheck size={56} />
          <Button
            type="primary"
            size="large"
            className="!mt-6"
            onClick={() => navigate(user ? "/dashboard" : "/signin", { replace: true })}
          >
            Continue
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        presetEmail
          ? `Enter the 6-digit code we sent to ${presetEmail}.`
          : "Enter your email and the 6-digit code from your inbox."
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

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onVerify}
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
              {
                pattern: /^\d{6}$/,
                message: "Code must be 6 digits",
              },
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

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Verify email
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
