import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { racesConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminRaces() {
  return (
    <PageTransition>
      <ResourceManager config={racesConfig} />
    </PageTransition>
  );
}
