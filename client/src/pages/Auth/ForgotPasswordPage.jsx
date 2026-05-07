import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { Shake } from "../../components/ui/Shake";
import { usePageTitle } from "../../hooks/usePageTitle";

export function ForgotPasswordPage() {
  usePageTitle("Forgot password");
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  // After a successful submit we render an in-place "Check your email"
  // confirmation rather than redirecting — gives the user a moment to
  // process before they jump into the reset flow, and avoids the back-button
  // sending them straight back to the empty form.
  const [sentTo, setSentTo] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const onFinish = async ({ email }) => {
    setTopError(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      setSentTo(email);
      setDevOtp(res?.devOtp ?? null);
    } catch (err) {
      setShakeKey((k) => k + 1);
      setTopError(
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={
          <>
            We sent a password-reset link to{" "}
            <span className="font-semibold text-fg">{sentTo}</span>. Click
            the link in that email — or paste the 6-digit code below — to
            choose a new password.
          </>
        }
        footer={
          <Link to="/signin" className="text-accent font-medium hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Icon icon="mdi:email-fast-outline" className="text-3xl" />
          </div>
          {devOtp && (
            <Alert
              type="info"
              showIcon
              className="!mt-5 !w-full !text-left"
              title="Dev mode"
              description={
                <span>
                  Code:{" "}
                  <code className="font-mono font-bold tracking-widest">
                    {devOtp}
                  </code>
                </span>
              }
            />
          )}
          <p className="mt-5 text-sm text-fg-muted">
            Didn't get it? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-accent font-medium hover:underline"
            >
              try a different email
            </button>
            .
          </p>
          <Button
            type="primary"
            size="large"
            block
            className="!mt-6"
            onClick={() =>
              navigate("/reset-password", {
                state: { email: sentTo, devOtp },
              })
            }
          >
            Enter the code
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/signin" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Shake trigger={shakeKey}>
        {topError && (
          <Alert type="error" title={topError} showIcon className="!mb-4" />
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
            Send reset link
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
