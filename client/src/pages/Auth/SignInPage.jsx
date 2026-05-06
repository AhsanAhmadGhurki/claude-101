import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth/authContext";
import { ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";

export function SignInPage() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const onFinish = async (values) => {
    setTopError(null);
    setSubmitting(true);
    try {
      const result = await signin(values);
      if (result?.pendingOtp) {
        // Two-step signin: creds OK, OTP sent. Hand off to /login-otp where
        // the user enters the code from their email. devOtp is dev-only and
        // gets surfaced as a hint on that page.
        navigate("/login-otp", {
          state: {
            email: result.email,
            devOtp: result.devOtp,
            redirectTo,
          },
        });
        return;
      }
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
          <Alert type="error" message={topError} showIcon className="!mb-4" />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          disabled={submitting}
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
