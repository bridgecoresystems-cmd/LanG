<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>{{ $t('footer.description') }}</h3>
          <p>{{ $t('footer.description') }}</p>
        </div>

        <div class="footer-section">
          <h4>{{ $t('footer.quickLinks') }}</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/landing">{{ $t('navbar.home') }}</NuxtLink></li>
            <li><NuxtLink to="/landing/about">{{ $t('navbar.about') }}</NuxtLink></li>
            <li><NuxtLink to="/landing/courses">{{ $t('navbar.courses') }}</NuxtLink></li>
            <li><NuxtLink to="/landing/contact">{{ $t('navbar.contact') }}</NuxtLink></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>{{ $t('footer.contact') }}</h4>
          <ul class="footer-contact">
            <li><i class="pi pi-map-marker"></i> {{ $t('footer.address') }}</li>
            <li><i class="pi pi-phone"></i> +993 64 58 59 58</li>
            <li><i class="pi pi-envelope"></i> info@bridgecore.tech</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Language School by BridgeCore SYSTEMS. {{ $t('footer.rights') }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  background-color: var(--text-primary);
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
  color: white;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.footer-links {
  list-style: none;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-contact {
  list-style: none;
}

.footer-contact li {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.footer-contact i {
  color: var(--primary-color);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
  }
}
</style>
