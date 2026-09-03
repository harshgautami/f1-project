import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { raceHistoryConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminRaceHistory() {
  return (
    <PageTransition>
      <ResourceManager config={raceHistoryConfig} />
    </PageTransition>
  );
}
