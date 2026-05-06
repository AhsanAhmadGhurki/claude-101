import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { ApiError } from "../../../client/src/api/client";
import { AuthShell } from "./AuthShell";
import { PasswordStrengthMeter } from "../../../client/src/components/ui/PasswordStrengthMeter";
import { Shake } from "../../../client/src/components/ui/Shake";
import { scorePassword } from "../../../client/src/services/auth/passwordStrength";

export function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  // Watch password value so the strength meter updates live.
  const password = Form.useWatch("password", form) || "";

  const onFinish = async (values) => {
    setTopError(null);
    setSubmitting(true);
    try {
      await signup(values);
      // After signup the user is signed in but unverified — send them to a
      // page that explains "check your inbox" and offers a resend option.
      navigate("/verify-email", {
        replace: true,
        state: { email: values.email },
      });
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
        setTopError(err.message || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Plan adventures, save itineraries, pick up where you left off."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </>
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
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter your name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input size="large" placeholder="Jane Explorer" autoComplete="name" />
          </Form.Item>

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
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "At least 8 characters" },
              {
                pattern: /(?=.*[A-Za-z])(?=.*\d)/,
                message: "Must include a letter and a number",
              },
              {
                validator: (_, value) =>
                  !value || scorePassword(value).score >= 2
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

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
          >
            Create account
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
