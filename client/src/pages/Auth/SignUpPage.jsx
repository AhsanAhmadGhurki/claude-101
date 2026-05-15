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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpPage() {
  usePageTitle("Create account");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  // Component-owned error state. Renders alongside Antd's own ErrorList so
  // visibility doesn't depend on Form internals — see SignInPage for the
  // same pattern + reasoning.
  const [errors, setErrors] = useState({});
  // Watch password value so the strength meter updates live.
  const password = Form.useWatch("password", form) || "";

  function validate(values) {
    const next = {};
    const name = (values.name ?? "").trim();
    const email = (values.email ?? "").trim();
    const pw = values.password ?? "";
    const confirmPw = values.confirmPassword ?? "";

    if (!name) next.name = "Name is required";
    else if (name.length < 2) next.name = "Name must be at least 2 characters";

    if (!email) {
      next.email = "Email is required";
    } else if (!EMAIL_RE.test(email)) {
      next.email = "Please enter a valid email address";
    }

    if (!pw) {
      next.password = "Password is required";
    } else if (pw.length < 8) {
      next.password = "At least 8 characters";
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(pw)) {
      next.password = "Must include a letter and a number";
    } else if (scorePassword(pw).score < 2) {
      next.password = "Choose a stronger password";
    }

    if (!confirmPw) {
      next.confirmPassword = "Please confirm your password";
    } else if (pw && pw !== confirmPw) {
      next.confirmPassword = "Passwords do not match";
    }

    return next;
  }

  const handleSubmit = async () => {
    if (submitting) return;
    setTopError(null);

    const raw = form.getFieldsValue([
      "name",
      "email",
      "password",
      "confirmPassword",
    ]);
    const nextErrors = validate(raw);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setShakeKey((k) => k + 1);
      const firstField = ["name", "email", "password", "confirmPassword"].find(
        (f) => nextErrors[f]
      );
      if (firstField) {
        try {
          form.scrollToField(firstField);
        } catch {
          /* field not registered yet — ignore */
        }
      }
      return;
    }

    setSubmitting(true);
    try {
      // Drop confirmPassword before sending — backend doesn't need it.
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...payload } = {
        name: raw.name.trim(),
        email: raw.email.trim(),
        password: raw.password,
        confirmPassword: raw.confirmPassword,
      };
      await signup(payload);
      navigate("/verify-email", {
        replace: true,
        state: { email: payload.email },
      });
    } catch (err) {
      setShakeKey((k) => k + 1);
      if (err instanceof ApiError && err.details) {
        setErrors((prev) => ({ ...prev, ...err.details }));
        setTopError(err.message || "Please fix the highlighted fields.");
      } else {
        setTopError(err.message || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Live mismatch detection on confirmPassword — surfaces the error as soon
  // as the user types instead of waiting for submit. We re-validate against
  // the current password field on every keystroke.
  const handleConfirmChange = (value) => {
    setErrors((prev) => {
      const pw = form.getFieldValue("password") || "";
      const next = { ...prev };
      if (!value) {
        // empty — let the submit validator handle "required"
        delete next.confirmPassword;
      } else if (pw && value !== pw) {
        next.confirmPassword = "Passwords do not match";
      } else {
        delete next.confirmPassword;
      }
      return next;
    });
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
          onFinish={(e) => e?.preventDefault?.()}
          disabled={submitting}
          autoComplete="on"
        >
          <Form.Item
            name="name"
            label="Name"
            validateStatus={errors.name ? "error" : undefined}
            help={errors.name}
          >
            <Input
              size="large"
              placeholder="Jane Explorer"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              onChange={() => clearFieldError("name")}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            validateStatus={errors.email ? "error" : undefined}
            help={errors.email}
          >
            <Input
              size="large"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              onChange={() => clearFieldError("email")}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            validateStatus={errors.password ? "error" : undefined}
            help={errors.password}
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
              aria-invalid={Boolean(errors.password)}
              onChange={() => clearFieldError("password")}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm password"
            validateStatus={errors.confirmPassword ? "error" : undefined}
            help={errors.confirmPassword}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              onChange={(e) => handleConfirmChange(e.target.value)}
              onPressEnter={handleSubmit}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="button"
            size="large"
            loading={submitting}
            onClick={handleSubmit}
            block
          >
            Create account
          </Button>
        </Form>
      </Shake>
    </AuthShell>
  );
}
