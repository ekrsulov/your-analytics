<script lang="ts">
  import { goto, stores } from '@sapper/app';
  import { session } from "../stores/session";

  const { page } = stores();
  const navigateAndFetchStats = async () => {
    await goto(`/${selectedWebsite}`);
  };

  let selectedWebsite = $page.params.site;
  $: websites = $session.user ? $session.user.sites : {};
  $: if (selectedWebsite !== $page.params.site) {
    navigateAndFetchStats();
  }
</script>

{#if Object.keys(websites).length >= 2}
  <div class="mx-2 mt-4">
    <select bind:value={selectedWebsite} class="form-select">
      {#each Object.entries(websites) as [value]}
        <option>{value}</option>
      {/each}
    </select>
  </div>
{/if}
