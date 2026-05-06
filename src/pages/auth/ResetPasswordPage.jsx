import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../../client/src/api/client";
import { AuthShell } from "./AuthShell";
import { PasswordStrengthMeter } from "../../../client/src/components/ui/PasswordStrengthMeter";
import { Shake } from "../../../client/src/components/ui/Shake";
import { SuccessCheck } from "../../../client/src/components/ui/SuccessCheck";
import { scorePassword } from "../../../client/src/services/auth/passwordStrength";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const password = Form.useWatch("password", form) || "";

  if (!token) {
    return (
      <AuthShell
        title="Reset link is invalid"
        subtitle="The link you followed is missing its token."
        footer={
          <Link to="/forgot-password" className="text-accent font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <Alert type="error" showIcon message="Missing reset token" />
      </AuthShell>
    );
  }

  const onFinish = async ({ password, confirm }) => {
    setTopError(null);
    if (password !== confirm) {
      form.setFields([{ name: "confirm", errors: ["Passwords don't match"] }]);
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword({ token, password });
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
      } else {
        setTopError(err.message || "Could not reset password.");
      }
    } finally {
      setSubmitting(false);
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
      title="Choose a new password"
      subtitle="Make it different from any previously used password."
    >
      <Shake trigger={shakeKey}>
        {topError && (
          <Alert type="error" showIcon message={topError} className="!mb-4" />
        )}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          disabled={submitting}
        >
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
      </Shake>
    </AuthShell>
  );
}
