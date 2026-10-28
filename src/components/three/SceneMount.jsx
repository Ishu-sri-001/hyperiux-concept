"use client";

import { Component, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import Scene from "./Scene";
import { TIERS } from "@/lib/device";
import { emit } from "@/lib/store";

/** Forwards real asset-loading progress (from three's loading manager) to the DOM loader. */
function ProgressBridge() {
  const { progress, loaded, total } = useProgress();
  useEffect(() => {
    emit("progress", { progress, loaded, total });
  }, [progress, loaded, total]);
  return null;
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("[hyperiux] 3D scene failed, showing static fallback.", error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneMount({ tier, eventSource, onError }) {
  return (
    <SceneBoundary onError={onError}>
      <ProgressBridge />
      <Scene config={TIERS[tier] ?? TIERS.mid} eventSource={eventSource} />
    </SceneBoundary>
  );
}
