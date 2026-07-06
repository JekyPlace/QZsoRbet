import { createFileRoute } from "@tanstack/react-router";
import ContextPage from "#/features/context/ContextPage";

export const Route = createFileRoute("/context")({ component: ContextPage });
