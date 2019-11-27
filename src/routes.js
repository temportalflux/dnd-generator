import React from 'react';
import { HomeView } from "./view/HomeView";
import { NpcView } from "./view/NpcView";
import { DataView } from "./view/DataView";

const routes = {
  "/": () => <HomeView />,
	"/npc": () => <NpcView />,
	// todo move table param to match all sub route https://github.com/Paratron/hookrouter/blob/master/src-docs/pages/en/02_routing.md#url-parameters
  "/data*": () => <DataView basePath='/data' />,
};

export default routes;