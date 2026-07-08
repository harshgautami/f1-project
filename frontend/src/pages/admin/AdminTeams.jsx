import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { teamsConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminTeams() {
  return (
    <PageTransition>
      <ResourceManager config={teamsConfig} />
    </PageTransition>
  );
}
