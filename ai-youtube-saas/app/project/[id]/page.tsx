import React from 'react';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { ProjectWorkspace } from '@/components/ProjectWorkspace';
import { notFound } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  
  await connectDB();
  
  let project;
  try {
    // Lean strips down mongoose magic, making it a pure JS object so it can cross the Server Component -> Client Component boundary cleanly
    project = await Project.findById(id).lean();
  } catch (e) {
    // If the ID is an invalid format (not a 24 hex string), Mongoose throws. We catch and 404 cleanly.
    return notFound();
  }

  if (!project) {
    return notFound();
  }

  // NextJS requires pure serialized JSON when passing objects from Server -> Client components
  const serializedProject = JSON.parse(JSON.stringify(project));

  return <ProjectWorkspace project={serializedProject} />;
}
