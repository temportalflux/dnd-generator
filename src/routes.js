import React from 'react';
import { NpcView } from "./view/NpcView";
import { DataView } from "./view/DataView";
import { HomeView } from './view/HomeView';

const routes = {
	"home": () => <HomeView />,
	"npc": () => <NpcView />,
  "data": () => <DataView />,
};

export default routes;