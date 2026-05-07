import { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/authContext";
import { ApiError } from "../../api/client";
import { AuthShell } from "./AuthShell";
import { PasswordStrengthMeter } from "../../components/ui/PasswordStrengthMeter";
import { Shake } from "../../components/ui/Shake";
import { scorePassword } from "../../services/auth/passwordStrength";
import { usePageTitle } from "../../hooks/usePageTitle";

export function SignUpPage() {
  usePageTitle("Create account");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  // Watch password value so the strength meter updates live.
  const password = Form.useWatch("password", form) || "";

  const handleSubmit = async () => {
    setTopError(null);
    // Explicitly validate every field (Antd equivalent of form.trigger())
    // so empty/invalid fields surface inline errors on the first submit.
    let values;
    try {
      values = await form.validateFields();
    } catch (errInfo) {
      // Scroll the first invalid field into view so the error message is
      // visible even on short viewports.
      if (errInfo?.errorFields?.length) {
        form.scrollToField(errInfo.errorFields[0].name);
      }
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    try {
      // Drop confirmPassword before sending — backend doesn't need it.
      const { confirmPassword: _omit, ...payload } = values;
      await signup(payload);
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
        // Also surface a top-of-form banner — inline field errors alone are
        // easy to miss (they sit far below the button), and the original
        // server message often reads better than the per-field text.
        setTopError(err.message || "Please fix the highlighted fields.");
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
          <Alert type="error" title={topError} showIcon className="!mb-4" />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          onFinishFailed={() => setShakeKey((k) => k + 1)}
          // Errors only appear once the user explicitly submits, instead
          // of yelling at them while they're mid-typing.
          validateTrigger="onSubmit"
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
            extra={
              <>
                <PasswordStrengthMeter password={password} />
                <div className="mt-1 text-xs text-fg-muted">
                  Use at least 8 characters, including a letter and a number.
                  Avoid common words and re-used passwords.
                </div>
              </>
            }
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm password"
            dependencies={["password"]}
            // Override the form-level "onSubmit" trigger so the mismatch
            // error surfaces the moment the user blurs / re-types — they
            // don't have to click Sign up to discover the typo.
            validateTrigger={["onBlur", "onChange"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Passwords do not match")
                  );
                },
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
            Create account
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
