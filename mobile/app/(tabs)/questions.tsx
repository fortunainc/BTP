import { Redirect } from "expo-router";

/** The Questions tab merged into Community. Old links and routes redirect there. */
export default function QuestionsRedirect() {
  return <Redirect href="/" />;
}
