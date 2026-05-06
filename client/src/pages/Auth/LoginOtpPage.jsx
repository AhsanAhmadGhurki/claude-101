import { useEffect, useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useAuth } from "../../store/auth/authContext";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";

// Step 2 of signin: confirm the 6-digit OTP that was emailed after a
// successful credentials check on /signin. The user's email + (in dev) the
// OTP itself arrive via location.state, set by SignInPage. If state is
// missing (e.g. someone deep-linked here), bounce back to /signin.
export function LoginOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyLoginOtp } = useAuth();
  const email = location.state?.email;
  const redirectTo = location.state?.redirectTo || "/dashboard";
  const devOtp = location.state?.devOtp ?? null;

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (!email) navigate("/signin", { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  const onFinish = async ({ code }) => {
    setTopError(null);
    setSubmitting(true);
    try {
      await verifyLoginOtp({ email, code });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setShakeKey((k) => k + 1);
      setTopError(
        err instanceof ApiError
          ? err.message
          : "Could not verify the code. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Confirm sign-in"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <Link to="/signin" className="text-accent font-medium hover:underline">
          Use a different account
        </Link>
      }
    >
      <Shake trigger={shakeKey}>
        {topError && (
          <Alert type="error" showIcon message={topError} className="!mb-4" />
        )}
        {devOtp && (
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
        >
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
              autoFocus
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
            Verify and sign in
          </Button>
        </Form>

        <div className="mt-4 text-center text-sm text-fg-muted">
          Didn&apos;t get a code?{" "}
          <Link
            to="/signin"
            replace
            className="text-accent font-medium hover:underline"
          >
            Try signing in again
          </Link>
          .
        </div>
      </Shake>
    </AuthShell>
  );
}
