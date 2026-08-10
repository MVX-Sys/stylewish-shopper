import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/produtos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/produtos"!</div>
}
