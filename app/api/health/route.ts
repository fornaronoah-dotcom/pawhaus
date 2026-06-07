// Health check voor Docker/Nginx load balancer.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "healthy" }, { status: 200 });
}
