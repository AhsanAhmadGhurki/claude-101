import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../auth/Shake";
import { SuccessCheck } from "../../auth/SuccessCheck";

export function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [devLink, setDevLink] = useState(null);

  const onFinish = async ({ email }) => {
    setTopError(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      // Server always responds 200 — we just confirm we sent the email.
      setDone(true);
      // Dev-only convenience: if SMTP isn't configured, surface the link.
      if (res?.resetLink) setDevLink(res.resetLink);
    } catch (err) {
      setShakeKey((k) => k + 1);
      setTopError(
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If an account exists for that email, we just sent a reset link."
        footer={
          <Link to="/signin" className="text-accent font-medium hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <SuccessCheck size={56} />
          <p className="mt-3 text-sm text-fg-muted">
            The link expires in 15 minutes.
          </p>
          {devLink && (
            <Alert
              className="!mt-4 !text-left w-full"
              type="info"
              showIcon
              message="Dev mode: SMTP not configured"
              description={
                <a
                  href={devLink}
                  className="text-accent break-all hover:underline"
                >
                  {devLink}
                </a>
              }
            />
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
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
            <Input size="large" placeholder="you@example.com" autoComplete="email" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Send reset link
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
