import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { driversConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminDrivers() {
  return (
    <PageTransition>
      <ResourceManager config={driversConfig} />
    </PageTransition>
  );
}
