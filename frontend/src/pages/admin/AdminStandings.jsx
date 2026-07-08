import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { standingsConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminStandings() {
  return (
    <PageTransition>
      <ResourceManager config={standingsConfig} />
    </PageTransition>
  );
}
