import { useEffect, useState } from "react";
import {
  Card,
  Avatar,
  Button,
  Skeleton,
  Alert,
  Space,
  Typography,
  Modal,
  Tag,
} from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/authContext";
import { api } from "../../api/client";

const { Title, Text } = Typography;

export function DashboardPage() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const [welcome, setWelcome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.dashboard();
        if (!cancelled) setWelcome(data.message);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmSignout = () => {
    Modal.confirm({
      title: "Sign out?",
      content: "You'll need to enter your credentials to sign back in.",
      okText: "Sign out",
      cancelText: "Stay signed in",
      okButtonProps: { danger: true, loading: signingOut },
      onOk: async () => {
        setSigningOut(true);
        await signout();
        navigate("/", { replace: true });
      },
    });
  };

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="!border-line !bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Avatar size={64} className="!bg-accent !text-bg !font-bold text-xl">
              {initial}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Title level={3} className="!mb-0 !text-fg">
                {user?.name}
              </Title>
              <Text className="!text-fg-muted">{user?.email}</Text>
              <div className="mt-1">
                {user?.isVerified ? (
                  <Tag color="success">Email verified</Tag>
                ) : (
                  <Tag color="warning">Email unverified</Tag>
                )}
              </div>
            </div>
          </div>

          {!user?.isVerified && (
            <Alert
              className="!mt-6"
              type="warning"
              showIcon
              message="Verify your email to unlock all features."
              action={
                <Button size="small" onClick={() => navigate("/verify-email")}>
                  Resend link
                </Button>
              }
            />
          )}

          <div className="mt-6">
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : error ? (
              <Alert type="error" message={error} showIcon />
            ) : (
              <Alert
                type="success"
                showIcon
                message={welcome}
                description="This message came from a JWT-protected API endpoint."
              />
            )}
          </div>

          <Space className="mt-6" wrap>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/builder")}
              icon={<Icon icon="mdi:auto-fix" />}
            >
              Plan a new trip
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/explore")}
              icon={<Icon icon="mdi:compass-outline" />}
            >
              Explore destinations
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/profile")}
              icon={<Icon icon="mdi:account-cog-outline" />}
            >
              Profile
            </Button>
            <Button
              size="large"
              danger
              onClick={confirmSignout}
              icon={<Icon icon="mdi:logout" />}
            >
              Sign out
            </Button>
          </Space>
        </Card>
      </motion.div>
    </section>
  );
}
