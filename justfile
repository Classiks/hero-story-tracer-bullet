set dotenv-load

container_name := "hero-story-tracer-bullet"

default:
  just --list

[group('Container')]
cnt-build: cnt-rm
  podman build . -t {{container_name}}

[group("Container")]
cnt-rm:
  podman rmi {{container_name}} || true

[group("Container")]
cnt-run:
  podman run --rm {{container_name}} -p 3001:3000
  
