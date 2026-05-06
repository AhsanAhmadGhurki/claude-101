import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Alert,
  Tabs,
  Typography,
  Space,
  Tag,
} from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { api, ApiError } from "../../../client/src/api/client";
import { PasswordStrengthMeter } from "../../auth/PasswordStrengthMeter";
import { Shake } from "../../auth/Shake";
import { scorePassword } from "../../auth/passwordStrength";

const { Title, Text } = Typography;

function applyServerErrors(form, err, setTopError) {
  if (err instanceof ApiError && err.details) {
    form.setFields(
      Object.entries(err.details).map(([name, message]) => ({
        name,
        errors: [message],
      }))
    );
  } else {
    setTopError(err.message || "Something went wrong.");
  }
}

function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  const onFinish = async (values) => {
    setTopError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const { user: updated } = await api.updateProfile(values);
      await refreshUser().catch(() => {});
      const emailChanged = updated.email !== user.email;
      setSuccess(
        emailChanged
          ? "Profile updated. Check your new inbox to re-verify the address."
          : "Profile updated."
      );
    } catch (err) {
      setShakeKey((k) => k + 1);
      applyServerErrors(form, err, setTopError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shake trigger={shakeKey}>
      {topError && (
        <Alert type="error" showIcon message={topError} className="!mb-4" />
      )}
      {success && (
        <Alert type="success" showIcon message={success} className="!mb-4" />
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: user.name, email: user.email }}
        onFinish={onFinish}
        disabled={submitting}
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: "Name is required" },
            { min: 2, message: "At least 2 characters" },
          ]}
        >
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Enter a valid email" },
          ]}
          extra={
            user.isVerified ? (
              <Tag color="success" className="!mt-1">Verified</Tag>
            ) : (
              <Tag color="warning" className="!mt-1">Unverified</Tag>
            )
          }
        >
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={submitting}
        >
          Save changes
        </Button>
      </Form>
    </Shake>
  );
}

function PasswordForm() {
  const navigate = useNavigate();
  const { signout } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const newPassword = Form.useWatch("newPassword", form) || "";

  const onFinish = async ({ currentPassword, newPassword, confirm }) => {
    setTopError(null);
    if (newPassword !== confirm) {
      form.setFields([{ name: "confirm", errors: ["Passwords don't match"] }]);
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      // Refresh tokens were revoked server-side; force a fresh sign-in.
      setTimeout(async () => {
        await signout();
        navigate("/signin", { replace: true });
      }, 1500);
    } catch (err) {
      setShakeKey((k) => k + 1);
      applyServerErrors(form, err, setTopError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shake trigger={shakeKey}>
      {topError && (
        <Alert type="error" showIcon message={topError} className="!mb-4" />
      )}
      {success && (
        <Alert
          type="success"
          showIcon
          message="Password changed. Signing you out…"
          className="!mb-4"
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={submitting || success}
        requiredMark={false}
      >
        <Form.Item
          name="currentPassword"
          label="Current password"
          rules={[{ required: true, message: "Please enter your current password" }]}
        >
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="New password"
          rules={[
            { required: true, message: "Please choose a new password" },
            { min: 8, message: "At least 8 characters" },
            {
              validator: (_, v) =>
                !v || scorePassword(v).score >= 2
                  ? Promise.resolve()
                  : Promise.reject(new Error("Choose a stronger password")),
            },
          ]}
          extra={<PasswordStrengthMeter password={newPassword} />}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm" },
            ({ getFieldValue }) => ({
              validator: (_, v) =>
                !v || v === getFieldValue("newPassword")
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords don't match")),
            }),
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={submitting}
        >
          Change password
        </Button>
      </Form>
    </Shake>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Space className="!mb-4">
          <Button
            type="text"
            icon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate("/dashboard")}
          >
            Back to dashboard
          </Button>
        </Space>
        <Card className="!border-line !bg-surface/80 backdrop-blur-md">
          <Title level={3} className="!mb-1 !text-fg">
            Profile
          </Title>
          <Text className="!text-fg-muted">
            Manage your account details and password.
          </Text>
          <Tabs
            className="!mt-4"
            defaultActiveKey="profile"
            items={[
              { key: "profile", label: "Profile", children: <ProfileForm /> },
              { key: "password", label: "Password", children: <PasswordForm /> },
            ]}
          />
        </Card>
      </motion.div>
    </section>
  );
}
