import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  const onFinish = async ({ email }) => {
    setTopError(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      // Server always responds 200 (no account-existence leak). We forward
      // the user to the reset-password page where they enter the OTP from
      // their email. devOtp is dev-only; passed through as state so the
      // reset page can surface it as a hint.
      navigate("/reset-password", {
        replace: true,
        state: { email, devOtp: res?.devOtp ?? null },
      });
    } catch (err) {
      setShakeKey((k) => k + 1);
      setTopError(
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a 6-digit code to reset it."
      footer={
        <Link to="/signin" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
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
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Send reset code
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
