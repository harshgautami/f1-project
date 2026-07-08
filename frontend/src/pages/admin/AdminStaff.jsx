import React from "react";
import ResourceManager from "../../components/ResourceManager";
import { staffConfig } from "../../config/resources";
import { PageTransition } from "../../components/motion";

export default function AdminStaff() {
  return (
    <PageTransition>
      <ResourceManager config={staffConfig} />
    </PageTransition>
  );
}
