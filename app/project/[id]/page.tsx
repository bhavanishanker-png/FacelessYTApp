import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return notFound();
  }

  await connectDB();

  let project;
  try {
    project = await Project.findOne({ _id: id, userId: (session.user as any).id }).lean();
  } catch (e) {
    return notFound();
  }

  if (!project) {
    return notFound();
  }

  const serializedProject = JSON.parse(JSON.stringify(project));

  return <ProjectWorkspace key={serializedProject._id.toString()} project={serializedProject} />;
}
