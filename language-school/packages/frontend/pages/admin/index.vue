<template>
  <div class="admin-page-content">
    <h1 class="text-h4 q-ma-none q-mb-md">Bridgecore admin panel</h1>
    <p class="text-subtitle1">Welcome to admin panel.</p>

    <QCard flat bordered>
      <QCardSection>
        <div class="row items-center justify-between">
          <div class="col-auto">
            <div class="text-subtitle2">Quick access</div>
            <div class="text-caption text-grey">
              Use the menu on the left to manage landing, users, schools and other sections.
            </div>
          </div>
          <div class="col-auto">
            <QBtn color="primary" label="Go to profile" to="/admin/profile" />
          </div>
        </div>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

