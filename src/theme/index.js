import { theme } from "antd";

const sharedTokens = {
  borderRadius: 12,
  borderRadiusLG: 16,
  borderRadiusSM: 8,
  fontFamily:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  controlHeight: 40,
  controlHeightLG: 48,
  motionDurationMid: "0.2s",
};

export const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...sharedTokens,
    colorPrimary: "#1F5F3A",
    colorInfo: "#1F5F3A",
    colorBgBase: "#F6F6F1",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorTextBase: "#15171A",
    colorBorder: "#E2E2D9",
    colorBorderSecondary: "#ECECE5",
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      primaryColor: "#FFFFFF",
      colorPrimaryHover: "#184E2F",
      colorPrimaryActive: "#143F26",
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      colorBgContainer: "#FFFFFF",
      activeBorderColor: "#1F5F3A",
      hoverBorderColor: "#1F5F3A",
    },
  },
};

export const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...sharedTokens,
    colorPrimary: "#C9F31E",
    colorInfo: "#C9F31E",
    colorBgBase: "#0F1110",
    colorBgContainer: "#181B19",
    colorBgElevated: "#1F221F",
    colorTextBase: "#EDEFE9",
    colorBorder: "#2A2D27",
    colorBorderSecondary: "#22251F",
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      primaryColor: "#0F1110",
      colorPrimaryHover: "#B5DD18",
      colorPrimaryActive: "#A5CC10",
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      colorBgContainer: "#181B19",
      activeBorderColor: "#C9F31E",
      hoverBorderColor: "#C9F31E",
    },
  },
};
