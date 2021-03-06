<script context="module" lang="ts">
  import type sapperCommon from "@sapper/common";
  import type { ISession } from "../../stores/session";
  import { getVisibility } from "../../api/settings";
  import { fetchAllStats } from "../../api/stats";
  import { initFilters } from "../../stores/stats-filters-query";

  export async function preload(page: sapperCommon.Page, session: ISession) {
    const { user } = session;
    const { visibility } = await getVisibility(this.fetch, page.host, page.path.substring(1));

    if (!user && visibility === "private") {
      this.redirect(302, "auth");
      return;
    }

    initFilters(page.query);
    const statsResults = await fetchAllStats(this.fetch, page.host, page.params.site);
    const stats = {};
    statsResults.forEach((statsResultPromise) => {
      if (statsResultPromise.status === "fulfilled") {
        stats[statsResultPromise.value.storeName] = statsResultPromise.value.data;
      }
    });

    return {
      stats
    };
  };
</script>

<script lang="ts">
  import { stores } from "@sapper/app";
  import { statsStores } from "../../api/stats";
  import Card from "../../components/card.svelte";
  import DateRange from "../../components/date-range.svelte";
  import WebsiteSelect from "../../components/website-select.svelte";
  import Header from "../../components/header/index.svelte";
  import MainContent from "../../components/main-content.svelte";
  import Devices from "../../components/stats/devices.svelte";
  import TopPages from "../../components/stats/top-pages.svelte";
  import TopReferrers from "../../components/stats/top-referrers.svelte";
  import TotalPageviews from "../../components/stats/total-pageviews.svelte";
  import UniqueVisitors from "../../components/stats/unique-visitors.svelte";
  import Visitors from "../../components/stats/visitors.svelte";
  import WorldMap from "../../components/stats/world-map.svelte";

  export let stats: {
    storeName: string;
    data: any;
  };;

  const { page } = stores();

  initFilters($page.query);

  Object.entries(stats).forEach(([storeName, data]) => {
    statsStores[storeName].set(data);
  });
</script>

<svelte:head>
  <title>Web analytics for {$page.params.site} | Your Analytics</title>
</svelte:head>

<div>
  <Header />
  <MainContent>
    <WebsiteSelect />
    <DateRange />
    <Card>
      <div class="sm:flex">
        <UniqueVisitors />
        <TotalPageviews />
      </div>
    </Card>
    <Card>
      <Visitors />
    </Card>
    <div class="md:flex md:justify-between">
      <div class="md:w-1/2">
        <Card>
          <TopPages />
        </Card>
      </div>
      <div class="md:w-1/2 md:ml-5">
        <Card>
          <TopReferrers />
        </Card>
      </div>
    </div>
    <div class="md:flex md:justify-between">
      <div class="md:w-1/2">
        <Card>
          <Devices />
        </Card>
      </div>
      <div class="md:w-1/2 md:ml-5">
        <Card>
          <WorldMap />
        </Card>
      </div>
    </div>
  </MainContent>
</div>
