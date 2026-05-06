import { useEffect, useState } from "react";
import { Button, Alert, Spin, Input, Form } from "antd";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import { useAuth } from "../../store/auth/authContext";
import { AuthShell } from "./AuthShell";
import { SuccessCheck } from "../../components/ui/SuccessCheck";

// Two modes:
//  - With ?token=...  → automatically verify (the email link path).
//  - Without token    → "check your inbox" + resend form (post-signup path).
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const presetEmail = location.state?.email || user?.email || "";

  const [verifying, setVerifying] = useState(Boolean(token));
  const [verifyError, setVerifyError] = useState(null);

  const [resendForm] = Form.useForm();
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [devLink, setDevLink] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await api.verifyEmail(token);
        if (cancelled) return;
        // Refresh /me so AuthProvider picks up isVerified=true.
        await refreshUser().catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setVerifyError(
            err instanceof ApiError ? err.message : "Verification failed."
          );
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  const onResend = async ({ email }) => {
    setResending(true);
    try {
      const res = await api.requestVerifyEmail(email);
      setResendDone(true);
      if (res?.verifyLink) setDevLink(res.verifyLink);
    } catch {
      // Always optimistic — server doesn't reveal whether the email exists.
      setResendDone(true);
    } finally {
      setResending(false);
    }
  };

  if (token) {
    if (verifying) {
      return (
        <AuthShell title="Verifying your email" subtitle="One moment…">
          <div className="flex justify-center py-4">
            <Spin size="large" />
          </div>
        </AuthShell>
      );
    }
    if (verifyError) {
      return (
        <AuthShell
          title="We couldn't verify that link"
          subtitle="It may have expired or already been used."
          footer={
            <Link to="/signin" className="text-accent font-medium hover:underline">
              Back to sign in
            </Link>
          }
        >
          <Alert type="error" showIcon message={verifyError} />
          <Button
            className="!mt-4"
            block
            size="large"
            onClick={() =>
              navigate("/verify-email", { replace: true, state: { email: presetEmail } })
            }
          >
            Request a new link
          </Button>
        </AuthShell>
      );
    }
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

  // No token in URL — show the "we sent you an email" + resend UI.
  return (
    <AuthShell
      title="Check your inbox"
      subtitle={
        presetEmail
          ? `We sent a verification link to ${presetEmail}. Click it to activate your account.`
          : "We sent you a verification link. Click it to activate your account."
      }
      footer={
        <Link to="/signin" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      {resendDone ? (
        <Alert
          type="success"
          showIcon
          message="If the address is on file, a new link is on the way."
          description={
            devLink ? (
              <a href={devLink} className="text-accent break-all hover:underline">
                {devLink}
              </a>
            ) : null
          }
        />
      ) : (
        <Form
          form={resendForm}
          layout="vertical"
          initialValues={{ email: presetEmail }}
          onFinish={onResend}
          disabled={resending}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Resend to"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input size="large" autoComplete="email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={resending} block>
            Resend verification email
          </Button>
        </Form>
      )}
    </AuthShell>
  );
}
