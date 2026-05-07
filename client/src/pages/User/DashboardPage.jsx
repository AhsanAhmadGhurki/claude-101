import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Avatar,
  Button,
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
import { ErrorState } from "../../components/ui/ErrorState";
import { usePageTitle } from "../../hooks/usePageTitle";

const { Title, Text } = Typography;

function flattenTrip(serverTrip) {
  const payload = serverTrip?.payload ?? {};
  return {
    ...payload,
    id: serverTrip.id,
    destination: serverTrip.destination ?? payload.destination,
    region: serverTrip.region ?? payload.region,
    tripType: serverTrip.tripType ?? payload.tripType,
    duration: serverTrip.duration,
    summary: serverTrip.summary ?? payload.summary,
    shareId: serverTrip.shareId,
    savedAt: serverTrip.savedAt,
  };
}

function formatSavedAt(ts) {
  if (!ts) return "Saved";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Saved";
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardPage() {
  usePageTitle("Dashboard");
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  // Controlled signout modal (mirrors Header) — see Header.jsx for the
  // reasoning behind avoiding Modal.confirm here.
  const [signoutModalOpen, setSignoutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Dashboard data is split into two parallel fetches so a transient failure
  // on either side doesn't blank the whole page — each section retries
  // independently.
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [recentTrips, setRecentTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await api.dashboard();
      setStats(data.stats ?? null);
    } catch (err) {
      setStatsError(err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    setTripsLoading(true);
    setTripsError(null);
    try {
      const { trips } = await api.listTrips();
      const flattened = (trips ?? []).map(flattenTrip);
      flattened.sort(
        (a, b) =>
          new Date(b.savedAt ?? 0).getTime() -
          new Date(a.savedAt ?? 0).getTime()
      );
      setRecentTrips(flattened.slice(0, 3));
    } catch (err) {
      setTripsError(err);
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadTrips();
  }, [loadStats, loadTrips]);

  const tripCount = stats?.count ?? recentTrips.length;
  const lastSavedLabel = stats?.lastSavedAt
    ? formatSavedAt(stats.lastSavedAt)
    : recentTrips[0]?.savedAt
    ? formatSavedAt(recentTrips[0].savedAt)
    : "—";

  const openSavedTrip = (trip) => {
    sessionStorage.setItem(
      "lastTrip",
      JSON.stringify({ ...trip, serverId: trip.id, savedFromServer: true })
    );
    navigate(`/trip/${trip.id}`);
  };

  const requestSignout = () => setSignoutModalOpen(true);

  const performSignout = async () => {
    setSigningOut(true);
    try {
      await signout();
      setSignoutModalOpen(false);
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
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
              icon={<Icon icon="mdi:email-alert-outline" />}
              title="Email not verified — saving and editing trips is disabled"
              description="We sent a verification link to your inbox. Confirm it to unlock saving trips, sharing links, and editing your library."
              action={
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate("/verify-email")}
                >
                  Verify email
                </Button>
              }
            />
          )}

          {statsError && (
            <div className="mt-6">
              <ErrorState
                title="Couldn't load your dashboard stats"
                message={
                  statsError?.message ||
                  "We couldn't reach the server. Try again."
                }
                onRetry={loadStats}
                retrying={statsLoading}
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat
              icon="mdi:bookmark-multiple-outline"
              label={tripCount === 1 ? "Saved trip" : "Saved trips"}
              value={statsLoading ? "…" : tripCount}
            />
            <Stat
              icon="mdi:map-marker-radius-outline"
              label="Destinations"
              value={
                statsLoading
                  ? "…"
                  : new Set(
                      recentTrips
                        .map((t) => (t?.destination ?? "").trim().toLowerCase())
                        .filter(Boolean)
                    ).size || (stats?.lastDestination ? 1 : 0)
              }
            />
            <Stat
              icon="mdi:calendar-clock-outline"
              label="Last saved"
              value={statsLoading ? "…" : lastSavedLabel}
            />
          </div>

          <div className="mt-6">
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate("/builder")}
              icon={<Icon icon="mdi:auto-fix" />}
              className="!h-12 !text-base !font-semibold"
            >
              Plan a new trip
            </Button>
          </div>

          <Space className="mt-3" wrap>
            <Button
              size="large"
              onClick={() => navigate("/saved-trips")}
              icon={<Icon icon="mdi:bookmark-outline" />}
            >
              Saved trips
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
              onClick={requestSignout}
              icon={<Icon icon="mdi:logout" />}
            >
              Sign out
            </Button>
          </Space>
        </Card>

        <Card className="!border-line !bg-surface/80 backdrop-blur-md !mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title level={4} className="!mb-0 !text-fg">
                Recent trips
              </Title>
              <Text className="!text-fg-muted text-sm">
                Your last {Math.min(recentTrips.length, 3)} saved {recentTrips.length === 1 ? "trip" : "trips"}
              </Text>
            </div>
            {!tripsLoading && !tripsError && tripCount > 3 && (
              <Button
                type="link"
                onClick={() => navigate("/saved-trips")}
                className="!px-0"
              >
                View all
              </Button>
            )}
          </div>
          {tripsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-surface-2 border border-line animate-pulse"
                />
              ))}
            </div>
          ) : tripsError ? (
            <ErrorState
              title="Couldn't load recent trips"
              message={
                tripsError?.message ||
                "We couldn't reach the server. Try again."
              }
              onRetry={loadTrips}
              retrying={tripsLoading}
            />
          ) : recentTrips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/40 p-6 text-center">
              <Icon
                icon="mdi:bookmark-outline"
                className="text-3xl text-fg-subtle mx-auto mb-2"
              />
              <p className="text-sm text-fg-muted">
                You haven't saved any trips yet. Plan one and tap{" "}
                <span className="font-semibold text-fg">Save</span> on the
                itinerary to see it here.
              </p>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentTrips.map((trip) => (
                <li key={trip.id ?? trip.destination}>
                  <button
                    type="button"
                    onClick={() => openSavedTrip(trip)}
                    className="w-full text-left rounded-2xl bg-surface-2 border border-line p-4 hover:border-accent/60 transition group"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                      {trip.tripType && <span>{trip.tripType}</span>}
                      {trip.tripType && trip.days?.length ? <span>·</span> : null}
                      {trip.days?.length ? <span>{trip.days.length}-day</span> : null}
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-fg line-clamp-1 group-hover:text-accent transition">
                      {trip.destination ?? "Untitled trip"}
                    </h3>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
                      <Icon icon="mdi:bookmark-outline" />
                      {formatSavedAt(trip.savedAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      <Modal
        open={signoutModalOpen}
        title="Sign out?"
        onOk={performSignout}
        onCancel={() => setSignoutModalOpen(false)}
        okText="Sign out"
        cancelText="Stay signed in"
        okButtonProps={{ danger: true, loading: signingOut }}
        cancelButtonProps={{ disabled: signingOut }}
        mask={{ closable: !signingOut }}
      >
        You'll need to enter your credentials to sign back in.
      </Modal>
    </section>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-line px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
        <Icon icon={icon} className="text-lg" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
          {label}
        </div>
        <div className="text-lg font-bold text-fg tabular-nums truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
