<template>
  <div class="members-container">
    <VCard class="main-card">

      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Gestion des Membres</h1>
          <p class="subtitle">
            Gérez les membres du club, leurs inscriptions et paiements.
          </p>
        </div>
        <div class="header-actions">
          <VBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate()">
            Nouveau membre
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField v-model="filters.q" placeholder="Rechercher par nom, prénom, email..." variant="solo"
          density="comfortable" hide-details clearable prepend-inner-icon="mdi-magnify" class="toolbar-item" />
        <VTextField v-model="filters.city" placeholder="Ville" variant="solo" density="comfortable" hide-details
          clearable class="toolbar-item" />
        <VSelect v-model="filters.imageRights" :items="imageRightsOptions" label="Droit à l'image" variant="solo"
          hide-details clearable class="toolbar-item" />
        <VSelect v-model="filters.status" :items="statusOptions" label="Statut" variant="solo" hide-details clearable
          class="toolbar-item" />
        <VBtn class="toolbar-item" variant="tonal" @click="resetFilters">
          Réinitialiser
        </VBtn>
      </div>

      <!-- TABLEAU DES MEMBRES -->
      <div class="list-section">
        <VTable class="members-table">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col">Téléphone</th>
              <th scope="col">Ville</th>
              <th scope="col">Âge</th>
              <th scope="col">Statut</th>
              <th scope="col">Droit à l'image</th>
              <th scope="col">Événements inscrits</th>
              <th scope="col" class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member._id" class="hover-row">
              <td>
                <div class="member-name">
                  <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                </div>
              </td>
              <td>{{ member.email }}</td>
              <td>{{ member.primaryPhone || '-' }}</td>
              <td>{{ member.city }}</td>
              <td>{{ member.age }} ans</td>
              <td>
                <VChip :color="getStatusColor(member.status || 'pré-inscrit')" size="small">
                  {{ getStatusLabel(member.status || 'pré-inscrit') }}
                </VChip>
              </td>
              <td>
                <VChip :color="member.imageRights ? 'success' : 'warning'" size="small">
                  {{ member.imageRights ? 'Oui' : 'Non' }}
                </VChip>
              </td>
              <td>
                <div v-if="member.enrolledEvents?.length" class="courses-summary">
                  <VTooltip>
                    <template #activator="{ props }">
                      <VChip color="primary" size="small" v-bind="props">
                        {{ member.enrolledEvents.length }} événement(s)
                      </VChip>
                    </template>
                    <template #default>
                      <div class="tooltip-content">
                        <div class="tooltip-events">
                          {{ getEventsTooltipEventsText(member) }}
                        </div>
                        <div v-if="hasUpcomingTrialDate(member)" class="tooltip-trial-date">
                          <VIcon icon="mdi-calendar-star" size="small" class="me-1" />
                          Première visite prévue: {{ getFormattedTrialDate(member) }}
                        </div>
                      </div>
                    </template>
                  </VTooltip>
                </div>
                <span v-else class="text-muted">Aucun</span>
              </td>
              <td class="col-actions">
                <div class="actions-container">
                  <VBtn icon="mdi-eye" variant="text" size="small" @click="openView(member)" />
                  <VBtn v-if="canEdit" icon="mdi-pencil" variant="text" size="small" @click="openEdit(member)" />
                  <VBtn v-if="canDelete" icon="mdi-delete" variant="text" size="small" color="error"
                    @click="openDelete(member)" />
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <div class="pagination-wrapper" v-if="pagination && pagination.pages > 1">
          <VPagination v-model="currentPage" :length="pagination.pages" :total-visible="7" />
        </div>
      </div>

      <VDivider />

      <!-- STATISTIQUES -->
      <div class="stats-section" v-if="stats">
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.totalMembers }}</div>
                <div class="stat-label">Total membres</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.membersWithImageRights }}</div>
                <div class="stat-label">Avec droit à l'image</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ getAgeGroupCount('18-24') }}</div>
                <div class="stat-label">18-24 ans</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.membersByCity?.[0]?.count || 0 }}</div>
                <div class="stat-label">Top ville</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <VDivider />

      <!-- GESTION DU RÈGLEMENT INTÉRIEUR -->
      <div class="rules-section">
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-h6 mb-1">Règlement Intérieur</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              Gérez le document officiel du règlement intérieur du club
            </p>
          </div>
          <VBtn color="primary" prepend-icon="mdi-file-upload" @click="openRulesUploadModal" :disabled="uploadingRules">
            Uploader nouveau règlement
          </VBtn>
        </div>

        <div v-if="activeRules" class="current-rules-card">
          <VCard variant="outlined">
            <VCardText>
              <div class="d-flex align-center justify-space-between">
                <div class="flex-grow-1">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-file-pdf-box" color="error" class="mr-2" />
                    <span class="text-h6">{{ activeRules.title }}</span>
                    <VChip color="success" size="small" class="ml-2">Actuel</VChip>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    Version {{ activeRules.version }} • Uploadé le {{ formatDate(activeRules.uploadDate) }}
                    <span v-if="activeRules.uploadedBy"> par {{ activeRules.uploadedBy.firstName }} {{
                      activeRules.uploadedBy.lastName }}</span>
                  </div>
                  <div v-if="activeRules.description" class="text-body-2 mb-2">
                    {{ activeRules.description }}
                  </div>
                  <div class="text-caption">
                    Taille: {{ formatFileSize(activeRules.fileSize) }}
                  </div>
                </div>
                <div class="d-flex flex-column ga-2">
                  <VBtn icon="mdi-download" variant="outlined" size="small" @click="downloadRules(activeRules)" />
                  <VBtn icon="mdi-history" variant="outlined" size="small" @click="openRulesHistoryModal" />
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
        <VAlert v-else type="warning" variant="tonal" class="mb-4">
          Aucun règlement intérieur n'est actuellement défini pour le club.
        </VAlert>
      </div>
    </VCard>

    <!-- MODAL CRÉATION/ÉDITION -->
    <VDialog v-model="showModal" max-width="800px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingMember ? 'Modifier le membre' : 'Nouveau membre' }}</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="closeModal" />
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm ref="form" @submit.prevent="saveMember">
            <VRow dense>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.firstName" label="Prénom *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.lastName" label="Nom *" required variant="outlined" density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.email" label="Email *" type="email" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VMenu v-model="showBirthDatePicker" :close-on-content-click="false" transition="scale-transition"
                  offset-y>
                  <template #activator="{ props }">
                    <VTextField v-model="formattedBirthDate" label="Date de naissance *"
                      prepend-inner-icon="mdi-calendar" variant="outlined" density="compact" readonly v-bind="props"
                      required />
                  </template>
                  <VDatePicker v-model="formData.birthDate" :max="maxBirthDate"
                    @update:model-value="showBirthDatePicker = false" />
                </VMenu>
              </VCol>
              <VCol cols="12">
                <VTextField v-model="formData.address" label="Adresse *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.postalCode" label="Code postal *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.city" label="Ville *" required variant="outlined" density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.homePhone" label="Téléphone domicile" variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.mobilePhone" label="Téléphone portable" variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12">
                <VCheckbox v-model="formData.imageRights" label="Droit à l'image" density="compact" />
              </VCol>
              <VCol cols="12">
                <div class="events-selection">
                  <VLabel class="mb-2">Événements inscrits</VLabel>
                  <div class="selected-events-display">
                    <div v-if="formData.enrolledEvents.length === 0" class="no-events">
                      Aucun événement sélectionné
                    </div>
                    <div v-else class="selected-events-list">
                      <VChip v-for="eventId in formData.enrolledEvents" :key="eventId"
                        :color="getEventChipColor(eventId)" size="small" closable @click:close="removeEvent(eventId)">
                        {{ getEventDisplayName(eventId) }}
                      </VChip>
                    </div>
                  </div>
                  <VBtn variant="outlined" prepend-icon="mdi-calendar-plus" @click="openEventSelector" class="mt-2">
                    {{ formData.enrolledEvents.length > 0 ? 'Modifier la sélection' : 'Sélectionner des événements' }}
                  </VBtn>
                </div>
              </VCol>

              <!-- Date d'essai pour les événements récurrents -->
              <VCol cols="12" v-if="hasRecurringEvents">
                <VMenu v-model="showTrialDatePicker" :close-on-content-click="false" transition="scale-transition"
                  offset-y>
                  <template #activator="{ props }">
                    <VTextField v-model="formattedTrialDate" label="Date du premier essai prévue"
                      prepend-inner-icon="mdi-calendar-star" variant="outlined" density="compact" readonly
                      v-bind="props"
                      hint="Choisissez parmi les dates disponibles de l'événement récurrent ou passez le statut à 'Inscrit' s'il est déjà venu" />
                  </template>
                  <VDatePicker v-model="formData.trialDate" :allowed-dates="allowedTrialDates"
                    @update:model-value="showTrialDatePicker = false" />
                </VMenu>
              </VCol>

              <!-- Champs admin -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <h4 class="text-h6 mb-3">Informations administratives</h4>
              </VCol>
              <VCol cols="12" md="6">
                <VMenu v-model="showRegistrationDatePicker" :close-on-content-click="false"
                  transition="scale-transition" offset-y>
                  <template #activator="{ props }">
                    <VTextField v-model="formattedRegistrationDate" label="Date d'inscription"
                      prepend-inner-icon="mdi-calendar" variant="outlined" density="compact" readonly v-bind="props" />
                  </template>
                  <VDatePicker v-model="formData.registrationDate" :max="maxRegistrationDate"
                    @update:model-value="showRegistrationDatePicker = false" />
                </VMenu>
              </VCol>
              <!-- Statut indépendant -->
              <VCol cols="12" md="6">
                <VSelect v-model="formData.status" :items="statusOptions" label="Statut" variant="outlined"
                  density="compact" clearable />
              </VCol>

              <!-- Paiements ajoutés -->
              <VCol cols="12" v-if="newPayments.length > 0">
                <VDivider class="my-3" />
                <h5 class="text-subtitle-1 mb-3">Paiements ajoutés</h5>
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th scope="col">Moyen</th>
                      <th scope="col">Montant</th>
                      <th scope="col">Objet</th>
                      <th scope="col">Date</th>
                      <th scope="col" class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(payment, idx) in newPayments" :key="idx">
                      <td>
                        <VChip :color="getPaymentMethodColor(payment.method)" size="small">
                          {{ getPaymentMethodLabel(payment.method) }}
                        </VChip>
                      </td>
                      <td>{{ payment.amount?.toFixed(2) || '0.00' }} €</td>
                      <td>{{ payment.purpose || '-' }}</td>
                      <td>{{ payment.date ? formatDate(payment.date) : '-' }}</td>
                      <td class="text-right">
                        <VBtn icon="mdi-pencil" size="small" variant="text" @click="editPayment(idx)" />
                        <VBtn icon="mdi-delete" size="small" variant="text" color="error" @click="removePayment(idx)" />
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>

              <!-- Membre existant: gestionnaire de paiements -->
              <VCol cols="12" v-if="editingMember">
                <VDivider class="my-3" />
                <PaymentsManager ref="paymentsManagerRef" :member-id="editingMember._id"
                  :has-pending-changes="newPayments.length > 0 || modifiedPayments.size > 0"
                  @add-payment="openPaymentStepper" @edit-payment="editExistingPayment" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VBtn v-if="!editingMember" color="secondary" prepend-icon="mdi-plus" @click="openPaymentStepper">
            Ajouter un paiement
          </VBtn>
          <VSpacer />
          <VBtn variant="text" @click="closeModal">Annuler</VBtn>
          <VBtn color="primary" @click="saveMember" :loading="saving">
            {{ editingMember ? 'Modifier' : 'Créer' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL DÉTAILS -->
    <MemberDetailsModal v-model="showViewModal" :member="viewingMember" @edit="openEdit" />

    <!-- MODAL SÉLECTION D'ÉVÉNEMENTS -->
    <EventSelectorModal v-model="showEventSelectorModal" :selected-event-ids="formData.enrolledEvents"
      :member-name="`${formData.firstName} ${formData.lastName}`" @confirm="onEventsSelected" />


    <!-- MODAL STEPPER PAIEMENT -->
    <VDialog v-model="showPaymentStepperModal" max-width="800px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Ajouter un paiement</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="closePaymentStepper" />
        </VCardTitle>
        <VCardText class="pa-4">
          <VStepper v-model="paymentStepperStep" class="elevation-0">
            <!-- Étape 1: Sélection du moyen de paiement -->
            <VStepperHeader>
              <VStepperItem :value="1" title="Moyen de paiement" />
              <VDivider />
              <VStepperItem :value="2" title="Détails du paiement" />
            </VStepperHeader>

            <VStepperWindow>
              <VStepperWindowItem :value="1">
                <div class="text-center py-6 px-4">
                  <h3 class="text-h6 mb-4">Choisissez le moyen de paiement</h3>
                  <VRow justify="center">
                    <VCol cols="12" md="4" v-for="method in paymentMethods" :key="method.value">
                      <VCard :class="['payment-method-card', { 'selected': paymentFormData.method === method.value }]"
                        @click="selectPaymentMethod(method.value)" hover elevation="2">
                        <VCardText class="text-center pa-4">
                          <VIcon :icon="getPaymentMethodIcon(method.value)" size="48"
                            :color="paymentFormData.method === method.value ? 'primary' : 'default'" class="mb-2" />
                          <div class="text-h6">{{ method.title }}</div>
                        </VCardText>
                      </VCard>
                    </VCol>
                  </VRow>
                </div>
              </VStepperWindowItem>

              <VStepperWindowItem :value="2">
                <div class="py-6 px-4">
                  <VForm ref="paymentForm" @submit.prevent="savePayment">
                    <VRow dense>
                      <!-- Champs communs -->
                      <VCol cols="12" md="6">
                        <VTextField v-model="paymentFormData.amount" label="Montant *" type="number" step="0.01"
                          required variant="outlined" density="compact" prepend-inner-icon="mdi-currency-eur" />
                      </VCol>
                      <VCol cols="12" md="6">
                        <VTextField v-model="paymentFormData.purpose" label="Objet" variant="outlined" density="compact"
                          placeholder="ex: Cotisation, Adhésion, Stage..." />
                      </VCol>
                      <VCol cols="12" md="6">
                        <VMenu v-model="showPaymentDatePicker" :close-on-content-click="false"
                          transition="scale-transition" offset-y>
                          <template #activator="{ props }">
                            <VTextField v-model="formattedPaymentDate" label="Date du paiement *"
                              prepend-inner-icon="mdi-calendar" variant="outlined" density="compact" readonly
                              v-bind="props" required />
                          </template>
                          <VDatePicker v-model="paymentFormData.date" :max="maxPaymentDate"
                            @update:model-value="showPaymentDatePicker = false" />
                        </VMenu>
                      </VCol>

                      <!-- Champs spécifiques au chèque -->
                      <template v-if="paymentFormData.method === 'chèque'">
                        <VCol cols="12" md="6">
                          <VTextField v-model="paymentFormData.bankName" label="Banque" variant="outlined"
                            density="compact" />
                        </VCol>
                        <VCol cols="12" md="6">
                          <VTextField v-model="paymentFormData.checkNumber" label="Numéro de chèque" variant="outlined"
                            density="compact" />
                        </VCol>
                        <VCol cols="12" md="6">
                          <VTextField v-model="paymentFormData.ibanLast4" label="4 derniers chiffres IBAN"
                            variant="outlined" density="compact" maxlength="4" />
                        </VCol>
                        <VCol cols="12" md="6">
                          <VTextField v-model="paymentFormData.remitBatch" label="Lot de remise" variant="outlined"
                            density="compact" />
                        </VCol>
                      </template>

                      <!-- Champs spécifiques à l'espèce -->
                      <template v-if="paymentFormData.method === 'Espèce'">
                        <VCol cols="12">
                          <VAlert type="info" variant="tonal" density="compact">
                            <VIcon icon="mdi-information" class="me-2" />
                            Paiement en espèces - Aucune information supplémentaire requise
                          </VAlert>
                        </VCol>
                      </template>
                    </VRow>
                  </VForm>
                </div>
              </VStepperWindowItem>
            </VStepperWindow>
          </VStepper>
        </VCardText>
        <VCardActions class="pa-4">
          <VBtn v-if="paymentStepperStep === 2" variant="text" @click="paymentStepperStep = 1">
            <VIcon icon="mdi-arrow-left" class="me-2" />
            Précédent
          </VBtn>
          <VSpacer />
          <VBtn variant="text" @click="closePaymentStepper">Annuler</VBtn>
          <VBtn v-if="paymentStepperStep === 2" color="primary" @click="savePayment" :loading="savingPayment">
            {{ editingExistingPayment ? 'Modifier le paiement' : 'Ajouter le paiement' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL SUPPRESSION -->
    <VDialog v-model="showDeleteModal" max-width="400px">
      <VCard>
        <VCardTitle>Confirmer la suppression</VCardTitle>
        <VCardText>
          Êtes-vous sûr de vouloir supprimer le membre
          <strong>{{ deletingMember?.firstName }} {{ deletingMember?.lastName }}</strong> ?
          <br>
          Cette action est irréversible.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showDeleteModal = false">Annuler</VBtn>
          <VBtn color="error" @click="deleteMember" :loading="deleting">Supprimer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL UPLOAD RÈGLEMENT INTÉRIEUR -->
    <VDialog v-model="showRulesUploadModal" max-width="600px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Uploader un nouveau règlement intérieur</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="closeRulesUploadModal" />
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm ref="rulesForm" @submit.prevent="uploadRules">
            <VRow dense>
              <VCol cols="12">
                <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                  Le nouveau règlement sera automatiquement défini comme actuel et remplacera l'ancien.
                </VAlert>
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="rulesFormData.version" label="Version *" required variant="outlined"
                  density="compact" placeholder="ex: 2024.1" />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="rulesFormData.title" label="Titre" variant="outlined" density="compact"
                  placeholder="Règlement Intérieur" />
              </VCol>

              <VCol cols="12">
                <VTextarea v-model="rulesFormData.description" label="Description (optionnelle)" variant="outlined"
                  density="compact" rows="3" placeholder="Description des modifications ou ajouts..." />
              </VCol>

              <VCol cols="12">
                <VFileInput v-model="rulesFormData.file" label="Fichier PDF *" variant="outlined" density="compact"
                  accept=".pdf" show-size required prepend-icon="mdi-file-pdf-box" :error-messages="rulesFileError" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeRulesUploadModal" :disabled="uploadingRules">Annuler</VBtn>
          <VBtn color="primary" @click="uploadRules" :loading="uploadingRules">
            Uploader
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL HISTORIQUE RÈGLEMENT INTÉRIEUR -->
    <VDialog v-model="showRulesHistoryModal" max-width="800px">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Historique des règlements intérieurs</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="showRulesHistoryModal = false" />
        </VCardTitle>
        <VCardText class="pa-4">
          <div v-if="rulesHistory.length > 0">
            <VCard v-for="rules in rulesHistory" :key="rules._id" variant="outlined" class="mb-3">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-2">
                      <VIcon icon="mdi-file-pdf-box" color="error" class="mr-2" />
                      <span class="font-weight-medium">{{ rules.title }}</span>
                      <VChip v-if="rules.isActive" color="success" size="small" class="ml-2">Actuel</VChip>
                      <VChip v-else color="default" size="small" class="ml-2">Archive</VChip>
                    </div>
                    <div class="text-caption text-medium-emphasis mb-1">
                      Version {{ rules.version }} • {{ formatDate(rules.uploadDate) }}
                      <span v-if="rules.uploadedBy"> par {{ rules.uploadedBy.firstName }} {{ rules.uploadedBy.lastName
                      }}</span>
                    </div>
                    <div v-if="rules.description" class="text-body-2 mb-1">
                      {{ rules.description }}
                    </div>
                    <div class="text-caption">
                      {{ formatFileSize(rules.fileSize) }}
                    </div>
                  </div>
                  <div class="d-flex flex-column ga-2">
                    <VBtn icon="mdi-download" variant="outlined" size="small" @click="downloadRules(rules)" />
                    <VBtn v-if="!rules.isActive" icon="mdi-check" variant="outlined" size="small" color="success"
                      @click="setActiveRules(rules)" title="Définir comme actuel" />
                    <VBtn v-if="!rules.isActive" icon="mdi-delete" variant="outlined" size="small" color="error"
                      @click="deleteRulesVersion(rules)" title="Supprimer cette version" />
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
          <VAlert v-else type="info" variant="tonal">
            Aucun historique de règlement intérieur disponible.
          </VAlert>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import { useViewPermissions } from '@/composables/useViewPermissions'
import MemberDetailsModal from '@/components/MemberDetailsModal.vue'
import PaymentsManager from '@/components/PaymentsManager.vue'
import EventSelectorModal from '@/components/EventSelectorModal.vue'
import type { Member, InternalRules, Course, Stats } from '@/types'

// Interface pour les événements (étend Course)
interface Event {
  _id: string
  title: string
  level: string
  type: string
  start: string
  end: string
  recurrence: 'Aucune' | 'Hebdomadaire' | 'Toutes les 2 semaines' | 'Mensuelle'
}

// État réactif
const route = useRoute()
const router = useRouter()
const api = useApi()
const { showSuccess, showError, showWarning } = useNotifications()
// Permissions pour cette vue
const { canCreate, canEdit, canDelete } = useViewPermissions('members')

const members = ref<Member[]>([])
const events = ref<Event[]>([])
const stats = ref<Stats | null>(null)
const currentPage = ref(1)
const pagination = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)


// Variables pour les règlements intérieurs
const activeRules = ref<InternalRules | null>(null)
const rulesHistory = ref<InternalRules[]>([])
const uploadingRules = ref(false)
const rulesFileError = ref<string>('')

// Modals
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const showBirthDatePicker = ref(false)
const showRegistrationDatePicker = ref(false)
const showTrialDatePicker = ref(false)
const showRulesUploadModal = ref(false)
const showRulesHistoryModal = ref(false)
const showEventSelectorModal = ref(false)

// Variables pour le stepper de paiement
const showPaymentStepperModal = ref(false)
const paymentStepperStep = ref(1)
const savingPayment = ref(false)
const showPaymentDatePicker = ref(false)
const editingPaymentIndex = ref(-1)
const editingExistingPayment = ref<any>(null)
const paymentsManagerRef = ref()

// Paiements ajoutés pour un nouveau membre avant création
const newPayments = ref<any[]>([])

// Paiements modifiés (pour les membres existants)
const modifiedPayments = ref<Set<string>>(new Set())

// Données du formulaire de paiement
const paymentFormData = ref({
  method: '',
  amount: '',
  purpose: '',
  date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
  bankName: '',
  checkNumber: '',
  ibanLast4: '',
  remitBatch: '',
  status: 'recu'
})

// Variables supprimées : activeTab (maintenant dans le composant MemberDetailsModal)
const maxChequeDate = computed(() => new Date().toISOString().split('T')[0])

// Form data
const editingMember = ref<Member | null>(null)
const viewingMember = ref<Member | null>(null)
const deletingMember = ref<Member | null>(null)

const formData = reactive({
  firstName: '',
  lastName: '',
  birthDate: '',
  address: '',
  postalCode: '',
  city: '',
  homePhone: '',
  mobilePhone: '',
  email: '',
  imageRights: false,
  enrolledEvents: [] as any[],
  trialDate: '',
  registrationDate: '',
  status: 'pré-inscrit' as 'pré-inscrit' | 'inscrit' | 'actif' | 'inactif',
})

// Form data pour les règlements intérieurs
const rulesFormData = reactive({
  title: 'Règlement Intérieur',
  version: '',
  description: '',
  file: null as File[] | null
})

// Filtres
const filters = reactive({
  q: '',
  city: '',
  imageRights: null,
  status: null,
})

// Options
const imageRightsOptions = [
  { title: 'Avec droit à l\'image', value: 'true' },
  { title: 'Sans droit à l\'image', value: 'false' },
]

const statusOptions = [
  { title: 'Pré-inscrit', value: 'pré-inscrit' },
  { title: 'Inscrit', value: 'inscrit' },
  { title: 'Actif', value: 'actif' },
  { title: 'Inactif', value: 'inactif' },
]

const paymentMethods = [
  { title: 'Chèque', value: 'chèque' },
  { title: 'Espèce', value: 'Espèce' },
]

// Méthodes pour la gestion des événements sélectionnés
const openEventSelector = () => {
  showEventSelectorModal.value = true
}

const onEventsSelected = (selectedEvents: any[]) => {
  // Convertir les événements sélectionnés en format EventEnrollment
  formData.enrolledEvents = selectedEvents.map(event => {
    if (event.isAllOccurrences) {
      // Pour "toutes les occurrences", on garde un seul événement récurrent
      return {
        eventId: event.eventId,
        isRecurring: true,
        isAllOccurrences: true,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        recurrence: event.recurrence,
        time: event.time
      }
    } else if (event.isRecurring) {
      return {
        eventId: event.eventId,
        occurrenceDate: event.occurrenceDate,
        isRecurring: true,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        time: event.time
      }
    } else {
      return {
        eventId: event.eventId,
        isRecurring: false,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        time: event.time,
        eventDate: event.eventDate // Inclure la date de l'événement ponctuel
      }
    }
  })
}

const removeEvent = (eventEnrollment: any) => {
  const index = formData.enrolledEvents.findIndex((event: any) => {
    if (typeof event === 'string') {
      return event === eventEnrollment
    } else {
      return event.eventId === eventEnrollment.eventId &&
        event.occurrenceDate === eventEnrollment.occurrenceDate &&
        event.isAllOccurrences === eventEnrollment.isAllOccurrences
    }
  })
  if (index > -1) {
    formData.enrolledEvents.splice(index, 1)
  }
}

const getEventDisplayName = (eventEnrollment: any) => {
  // Gérer le nouveau format d'objet avec populate (depuis le backend)
  if (typeof eventEnrollment === 'object') {
    // Si eventId est un objet (grâce au populate), l'utiliser directement
    if (eventEnrollment.eventId && typeof eventEnrollment.eventId === 'object') {
      const event = eventEnrollment.eventId
      if (eventEnrollment.isAllOccurrences) {
        return `${event.title} (Toutes les occurrences)`
      } else if (eventEnrollment.occurrenceDate) {
        const date = new Date(eventEnrollment.occurrenceDate).toLocaleDateString('fr-FR')
        return `${event.title} - ${date}`
      } else {
        return event.title
      }
    }

    // Si eventId est un string mais qu'on a les infos complètes (nouveau format du formulaire)
    if (typeof eventEnrollment.eventId === 'string' && eventEnrollment.title) {
      if (eventEnrollment.isAllOccurrences) {
        return `${eventEnrollment.title} (Toutes les occurrences)`
      } else if (eventEnrollment.occurrenceDate) {
        const date = new Date(eventEnrollment.occurrenceDate).toLocaleDateString('fr-FR')
        return `${eventEnrollment.title} - ${date}`
      } else if (eventEnrollment.eventDate) {
        // Événement ponctuel avec date
        const date = new Date(eventEnrollment.eventDate).toLocaleDateString('fr-FR')
        return `${eventEnrollment.title} - ${date}`
      } else {
        return eventEnrollment.title
      }
    }

    // Si eventId est un string (ancien format), chercher dans events.value
    if (typeof eventEnrollment.eventId === 'string') {
      const event = events.value.find(e => e._id === eventEnrollment.eventId)
      if (event) {
        if (eventEnrollment.isAllOccurrences) {
          return `${event.title} (Toutes les occurrences)`
        } else if (eventEnrollment.occurrenceDate) {
          const date = new Date(eventEnrollment.occurrenceDate).toLocaleDateString('fr-FR')
          return `${event.title} - ${date}`
        } else {
          return event.title
        }
      }
    }
  }

  // Gérer l'ancien format string (compatibilité)
  if (typeof eventEnrollment === 'string') {
    if (eventEnrollment.includes('_')) {
      // Occurrence récurrente
      const [originalId, occurrenceDate] = eventEnrollment.split('_')
      const event = events.value.find(e => e._id === originalId)
      if (event) {
        const date = new Date(occurrenceDate).toLocaleDateString('fr-FR')
        return `${event.title} - ${date}`
      }
    } else {
      // Événement simple
      const event = events.value.find(e => e._id === eventEnrollment)
      if (event) {
        return event.title
      }
    }
  }

  return eventEnrollment?.eventId?.title || eventEnrollment?.title || eventEnrollment?.eventId || eventEnrollment || 'Événement inconnu'
}

const getEventChipColor = (eventEnrollment: any) => {
  let event = null

  // Gérer le nouveau format d'objet avec populate
  if (typeof eventEnrollment === 'object') {
    // Si eventId est un objet (grâce au populate), l'utiliser directement
    if (eventEnrollment.eventId && typeof eventEnrollment.eventId === 'object') {
      event = eventEnrollment.eventId
    }
    // Si eventId est un string mais qu'on a les infos complètes (nouveau format du formulaire)
    else if (typeof eventEnrollment.eventId === 'string' && eventEnrollment.type) {
      event = eventEnrollment
    }
    // Si eventId est encore un string (ancien format), chercher dans events.value
    else if (typeof eventEnrollment.eventId === 'string') {
      event = events.value.find(e => e._id === eventEnrollment.eventId)
    }
  }
  // Gérer l'ancien format string (compatibilité)
  else if (typeof eventEnrollment === 'string') {
    let eventId = eventEnrollment
    if (eventId.includes('_')) {
      // Occurrence récurrente
      const [originalId] = eventId.split('_')
      eventId = originalId
    }
    event = events.value.find(e => e._id === eventId)
  }

  if (event) {
    // Utiliser le niveau de difficulté pour la couleur
    switch (event.level) {
      case 'Débutant': return 'success'
      case 'Novice': return 'info'
      case 'Intermédiaire': return 'warning'
      case 'Avancé': return 'error'
      case 'Tous niveaux': return 'primary'
      default: return 'default'
    }
  }
  return 'default'
}



// Gestion du stepper de paiement
const openPaymentStepper = () => {
  paymentStepperStep.value = 1
  editingPaymentIndex.value = -1
  resetPaymentForm()
  showPaymentStepperModal.value = true
}

const editExistingPayment = (payment: any) => {
  // Stocker le paiement en cours d'édition
  editingExistingPayment.value = payment

  // Remplir le formulaire avec les données du paiement existant
  paymentFormData.value = {
    method: payment.paymentMethod,
    amount: payment.amount.toString(),
    purpose: payment.purpose,
    date: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
    bankName: '',
    checkNumber: '',
    ibanLast4: '',
    remitBatch: '',
    status: 'recu'
  }

  // Extraire les informations de chèque de la description si c'est un chèque
  if (payment.paymentMethod === 'chèque' && payment.description) {
    const desc = payment.description
    const bankMatch = desc.match(/Banque: ([^,]+)/)
    const checkMatch = desc.match(/N°: ([^,]+)/)
    const ibanMatch = desc.match(/IBAN: \*\*\*\*([^,]+)/)
    const batchMatch = desc.match(/Lot: ([^,]+)/)

    if (bankMatch) paymentFormData.value.bankName = bankMatch[1]
    if (checkMatch) paymentFormData.value.checkNumber = checkMatch[1]
    if (ibanMatch) paymentFormData.value.ibanLast4 = ibanMatch[1]
    if (batchMatch) paymentFormData.value.remitBatch = batchMatch[1]
  }

  // Aller directement à l'étape 2 et ouvrir le stepper
  paymentStepperStep.value = 2
  showPaymentStepperModal.value = true
}

const closePaymentStepper = () => {
  showPaymentStepperModal.value = false
  paymentStepperStep.value = 1
  editingPaymentIndex.value = -1
  editingExistingPayment.value = null
  resetPaymentForm()
}

const selectPaymentMethod = (method: string) => {
  paymentFormData.value.method = method
  // Passer automatiquement à l'étape suivante
  paymentStepperStep.value = 2
}

const resetPaymentForm = () => {
  paymentFormData.value = {
    method: '',
    amount: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
    bankName: '',
    checkNumber: '',
    ibanLast4: '',
    remitBatch: '',
    status: 'recu'
  }
}

const savePayment = async () => {
  try {
    savingPayment.value = true

    // Validation
    if (!paymentFormData.value.method || !paymentFormData.value.amount || !paymentFormData.value.purpose || !paymentFormData.value.date) {
      showError('Veuillez remplir tous les champs obligatoires')
      return
    }

    const paymentData = {
      ...paymentFormData.value,
      amount: parseFloat(paymentFormData.value.amount),
      date: toLocalISOString(paymentFormData.value.date),
      description: paymentFormData.value.bankName ? `Banque: ${paymentFormData.value.bankName}${paymentFormData.value.checkNumber ? `, N°: ${paymentFormData.value.checkNumber}` : ''}${paymentFormData.value.ibanLast4 ? `, IBAN: ****${paymentFormData.value.ibanLast4}` : ''}${paymentFormData.value.remitBatch ? `, Lot: ${paymentFormData.value.remitBatch}` : ''}` : ''
    }

    if (editingExistingPayment.value) {
      // Modification d'un paiement existant
      const paymentDataForAPI = {
        amount: paymentData.amount,
        purpose: paymentData.purpose,
        paymentMethod: paymentData.method,
        paymentDate: paymentData.date,
        description: paymentData.bankName ? `Banque: ${paymentData.bankName}${paymentData.checkNumber ? `, N°: ${paymentData.checkNumber}` : ''}${paymentData.ibanLast4 ? `, IBAN: ****${paymentData.ibanLast4}` : ''}${paymentData.remitBatch ? `, Lot: ${paymentData.remitBatch}` : ''}` : undefined
      }

      await api.put(`/payments/${editingExistingPayment.value._id}`, paymentDataForAPI)
      showSuccess('Paiement modifié avec succès')

      // Marquer ce paiement comme modifié
      modifiedPayments.value.add(editingExistingPayment.value._id)

      // Recharger les paiements dans le PaymentsManager
      if (paymentsManagerRef.value) {
        paymentsManagerRef.value.reloadPayments()
      }
    } else if (editingPaymentIndex.value >= 0) {
      // Modification d'un nouveau paiement (pas encore créé)
      newPayments.value[editingPaymentIndex.value] = paymentData
      showSuccess('Paiement modifié dans la liste (sera sauvegardé avec le membre)')
    } else {
      // Ajout d'un nouveau paiement
      newPayments.value.push(paymentData)
      showSuccess('Paiement ajouté à la liste (sera sauvegardé avec le membre)')
    }

    closePaymentStepper()
  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement:', error)
    showError('Erreur lors de l\'ajout du paiement')
  } finally {
    savingPayment.value = false
  }
}

const editPayment = (index: number) => {
  editingPaymentIndex.value = index
  const payment = newPayments.value[index]

  // Convertir la date ISO en format local pour le datepicker
  let dateForForm = ''
  if (payment.date) {
    try {
      const date = new Date(payment.date)
      if (!isNaN(date.getTime())) {
        // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        dateForForm = `${year}-${month}-${day}`
      }
    } catch (error) {
      console.error('Erreur lors de la conversion de la date:', error)
    }
  }

  paymentFormData.value = {
    method: payment.method,
    amount: payment.amount.toString(),
    purpose: payment.purpose,
    date: dateForForm,
    bankName: payment.bankName || '',
    checkNumber: payment.checkNumber || '',
    ibanLast4: payment.ibanLast4 || '',
    remitBatch: payment.remitBatch || '',
    status: payment.status || 'recu'
  }
  paymentStepperStep.value = 2
  showPaymentStepperModal.value = true
}

const removePayment = (idx: number) => {
  newPayments.value.splice(idx, 1)
}

// Méthodes utilitaires pour les paiements
const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'chèque': return 'mdi-bank-check'
    case 'Espèce': return 'mdi-cash'
    default: return 'mdi-credit-card'
  }
}

const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case 'chèque': return 'primary'
    case 'Espèce': return 'success'
    default: return 'default'
  }
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'chèque': return 'Chèque'
    case 'Espèce': return 'Espèces'
    default: return method
  }
}

// Méthodes
const loadMembers = async () => {
  try {
    loading.value = true

    // Construire les paramètres en excluant les valeurs vides
    const params: Record<string, string> = {
      page: currentPage.value.toString(),
      limit: '20',
    }

    // Ajouter seulement les filtres non vides
    if (filters.q) params.q = filters.q
    if (filters.city) params.city = filters.city
    if (filters.imageRights !== null && filters.imageRights !== '') params.imageRights = filters.imageRights
    if (filters.status) params.status = filters.status

    const queryString = new URLSearchParams(params).toString()
    console.log('Paramètres envoyés:', params) // Debug
    console.log('URL de requête:', `/members?${queryString}`) // Debug
    const response = await api.get<any>(`/members?${queryString}`)
    console.log('Réponse complète reçue:', response) // Debug
    members.value = response.data || []
    pagination.value = (response as any).pagination || null

    // Vérifier si on doit ouvrir une modale après le chargement des membres
    const memberId = route.query.view
    if (memberId && typeof memberId === 'string') {
      openViewById(memberId)
    }
  } catch (error: any) {
    console.error('Erreur lors du chargement des membres:', error)
    showError('Erreur lors du chargement des membres. Veuillez réessayer.')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const payload = await api.getData<Stats>('/members/stats')
    stats.value = payload
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  }
}

const loadEvents = async () => {
  try {
    const payload = await api.getData<Event[]>('/events/upcoming?limit=1000')
    events.value = payload
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
  }
}

const resetFilters = () => {
  filters.q = ''
  filters.city = ''
  filters.imageRights = null
  filters.status = null
  currentPage.value = 1
  loadMembers()
}

const openCreate = () => {
  editingMember.value = null
  resetForm()
  showModal.value = true
}

const openEdit = (member: Member) => {
  editingMember.value = member
  fillForm(member)
  showModal.value = true
}

const openView = (member: Member) => {
  viewingMember.value = member
  showViewModal.value = true
}

// Fonction pour ouvrir la modale de visualisation à partir d'un ID de membre
const openViewById = async (memberId: string) => {
  try {
    // Chercher le membre dans la liste actuelle
    let member = members.value.find(m => m._id === memberId)

    // Si le membre n'est pas trouvé dans la liste actuelle, le charger depuis l'API
    if (!member) {
      const response = await api.getData<Member>(`/members/${memberId}`)
      member = response
    }

    if (member) {
      viewingMember.value = member
      showViewModal.value = true
    } else {
      showError('Membre non trouvé')
    }
  } catch (error) {
    console.error('Erreur lors du chargement du membre:', error)
    showError('Erreur lors du chargement du membre')
  }
}

const openDelete = (member: Member) => {
  deletingMember.value = member
  showDeleteModal.value = true
}

// Fonction editFromView supprimée : maintenant gérée par le composant MemberDetailsModal

const closeModal = () => {
  showModal.value = false
  editingMember.value = null
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    firstName: '',
    lastName: '',
    birthDate: '',
    address: '',
    postalCode: '',
    city: '',
    homePhone: '',
    mobilePhone: '',
    email: '',
    imageRights: false,
    enrolledEvents: [],
    trialDate: '',
    registrationDate: '',
    status: 'pré-inscrit',
  })
  // Réinitialiser aussi les paiements
  newPayments.value = []
  modifiedPayments.value.clear()
}

const fillForm = (member: Member) => {
  // Traiter les événements inscrits pour reconstruire les valeurs du formulaire
  const processedEventValues = member.enrolledEvents?.map(enrollment => {
    // Maintenant enrollment contient eventId (grâce au populate) et les propriétés d'inscription
    if (enrollment.isAllOccurrences) {
      // Pour "toutes les occurrences", retourner l'objet complet
      return {
        eventId: enrollment.eventId._id,
        isRecurring: true,
        isAllOccurrences: true,
        title: enrollment.eventId.title,
        type: enrollment.eventId.type,
        level: enrollment.eventId.level,
        location: enrollment.eventId.location,
        recurrence: enrollment.eventId.recurrence,
        time: `${timeShort(enrollment.eventId.start)}–${timeShort(enrollment.eventId.end)}`
      }
    } else if (enrollment.occurrenceDate) {
      // Pour une occurrence spécifique
      return {
        eventId: enrollment.eventId._id,
        occurrenceDate: enrollment.occurrenceDate,
        isRecurring: true,
        title: enrollment.eventId.title,
        type: enrollment.eventId.type,
        level: enrollment.eventId.level,
        location: enrollment.eventId.location,
        time: `${timeShort(enrollment.eventId.start)}–${timeShort(enrollment.eventId.end)}`
      }
    } else {
      // Pour un événement simple
      return {
        eventId: enrollment.eventId._id,
        isRecurring: false,
        title: enrollment.eventId.title,
        type: enrollment.eventId.type,
        level: enrollment.eventId.level,
        location: enrollment.eventId.location,
        time: `${timeShort(enrollment.eventId.start)}–${timeShort(enrollment.eventId.end)}`,
        eventDate: enrollment.eventId.start.split('T')[0] // Ajouter la date de l'événement ponctuel
      }
    }
  }) || []

  Object.assign(formData, {
    firstName: member.firstName,
    lastName: member.lastName,
    birthDate: member.birthDate.split('T')[0],
    address: member.address,
    postalCode: member.postalCode,
    city: member.city,
    homePhone: member.homePhone || '',
    mobilePhone: member.mobilePhone || '',
    email: member.email,
    imageRights: member.imageRights,
    enrolledEvents: processedEventValues,
    trialDate: member.intendedTrialDate?.split('T')[0] || '',
    registrationDate: member.registrationDate?.split('T')[0] || '',
    status: member.status || 'pré-inscrit',
  })
}

// Fonction utilitaire pour convertir une date locale en ISO sans décalage de fuseau horaire
const toLocalISOString = (dateInput: string | Date) => {
  if (!dateInput) {
    return undefined
  }

  let dateString: string

  // Si c'est un objet Date, le convertir en chaîne YYYY-MM-DD
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear()
    const month = String(dateInput.getMonth() + 1).padStart(2, '0')
    const day = String(dateInput.getDate()).padStart(2, '0')
    dateString = `${year}-${month}-${day}`
  } else {
    dateString = dateInput
  }

  // Utiliser directement la date string pour éviter les problèmes de fuseau horaire
  return `${dateString}T00:00:00.000Z`
}

const saveMember = async () => {
  try {
    saving.value = true


    // Traiter les événements sélectionnés (déjà au bon format)
    const processedEvents = formData.enrolledEvents.map(eventValue => {
      // Si c'est déjà un objet (nouveau format)
      if (typeof eventValue === 'object') {
        return eventValue
      }

      // Si c'est une string (ancien format - compatibilité)
      if (typeof eventValue === 'string') {
        if (eventValue.includes('_') && eventValue.split('_').length === 2) {
          const [eventId, occurrenceDate] = eventValue.split('_')
          return {
            eventId,
            occurrenceDate,
            isRecurring: true
          }
        } else {
          return {
            eventId: eventValue,
            isRecurring: false
          }
        }
      }

      return eventValue
    })

    const memberData = {
      ...formData,
      birthDate: toLocalISOString(formData.birthDate),
      intendedTrialDate: toLocalISOString(formData.trialDate),
      registrationDate: toLocalISOString(formData.registrationDate),
      enrolledEvents: processedEvents
    }

    if (editingMember.value) {
      await api.put(`/members/${editingMember.value._id}`, memberData)

      // Créer les paiements saisis localement si présents
      if (newPayments.value.length > 0) {
        const memberId = editingMember.value._id
        let paymentErrors = 0

        for (const p of newPayments.value) {
          try {
            const paymentData = {
              amount: p.amount,
              purpose: p.purpose || 'Paiement',
              paymentMethod: p.method,
              paymentDate: p.date, // p.date est déjà au format ISO depuis savePayment
              description: p.bankName ? `Banque: ${p.bankName}${p.checkNumber ? `, N°: ${p.checkNumber}` : ''}${p.ibanLast4 ? `, IBAN: ****${p.ibanLast4}` : ''}${p.remitBatch ? `, Lot: ${p.remitBatch}` : ''}` : (p.description || '')
            }
            await api.postData(`/members/${memberId}/payments`, paymentData)
          } catch (error) {
            console.error('Erreur lors de la création du paiement:', error)
            paymentErrors++
          }
        }

        if (paymentErrors > 0) {
          showError(`${paymentErrors} paiement(s) n'ont pas pu être créés`)
        } else {
          showSuccess('Membre modifié et paiements créés avec succès')
        }

        // Recharger les paiements pour afficher les nouveaux
        if (paymentsManagerRef.value) {
          paymentsManagerRef.value.reloadPayments()
        }

        // Vider la liste des nouveaux paiements et des paiements modifiés
        newPayments.value = []
        modifiedPayments.value.clear()
      } else {
        showSuccess('Membre modifié avec succès')
      }
    } else {
      const created = await api.postData<any>('/members', memberData)

      // Créer les paiements saisis localement si présents
      if (created?._id && newPayments.value.length > 0) {
        const memberId = created._id
        let paymentErrors = 0

        for (const p of newPayments.value) {
          try {
            const paymentData = {
              amount: p.amount,
              purpose: p.purpose || 'Paiement',
              paymentMethod: p.method,
              paymentDate: p.date, // p.date est déjà au format ISO depuis savePayment
              description: p.bankName ? `Banque: ${p.bankName}${p.checkNumber ? `, N°: ${p.checkNumber}` : ''}${p.ibanLast4 ? `, IBAN: ****${p.ibanLast4}` : ''}${p.remitBatch ? `, Lot: ${p.remitBatch}` : ''}` : undefined
            }
            await api.postData(`/members/${memberId}/payments`, paymentData)
          } catch (paymentError) {
            console.error('Erreur création paiement:', paymentError)
            paymentErrors++
          }
        }

        if (paymentErrors > 0) {
          showWarning(`Membre créé, mais ${paymentErrors} paiement(s) n'ont pas pu être ajoutés`)
        } else {
          showSuccess('Membre et paiements créés avec succès')
        }
      } else {
        showSuccess('Membre créé avec succès')
      }
    }

    closeModal()
    loadMembers()
    loadStats()
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error)

    // Gestion des erreurs spécifiques
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message

      if (errorMessage.includes('email') && errorMessage.includes('existe')) {
        showError('Cet email est déjà utilisé par un autre membre')
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('E11000')) {
        showError('Ces informations sont déjà utilisées par un autre membre')
      } else {
        showError(`Erreur: ${errorMessage}`)
      }
    } else if (error.message) {
      showError(`Erreur lors de la sauvegarde: ${error.message}`)
    } else {
      showError('Erreur inconnue lors de la sauvegarde du membre')
    }
  } finally {
    saving.value = false
  }
}

const deleteMember = async () => {
  if (!deletingMember.value) return

  try {
    deleting.value = true
    const memberName = `${deletingMember.value.firstName} ${deletingMember.value.lastName}`

    await api.delete(`/members/${deletingMember.value._id}`)

    showDeleteModal.value = false
    deletingMember.value = null
    loadMembers()
    loadStats()

    showSuccess(`Membre "${memberName}" supprimé avec succès`)
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)

    if (error.response?.data?.message) {
      showError(`Erreur: ${error.response.data.message}`)
    } else if (error.message) {
      showError(`Erreur lors de la suppression: ${error.message}`)
    } else {
      showError('Erreur inconnue lors de la suppression du membre')
    }
  } finally {
    deleting.value = false
  }
}

// Computed properties pour les date pickers
const formattedBirthDate = computed(() => {
  if (!formData.birthDate) return ''
  // Éviter les problèmes de fuseau horaire
  const date = new Date(formData.birthDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
})

const formattedRegistrationDate = computed(() => {
  if (!formData.registrationDate) return ''
  // Éviter les problèmes de fuseau horaire
  const date = new Date(formData.registrationDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
})

// Date maximale pour la naissance (aujourd'hui)
const maxBirthDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Date maximale pour l'inscription (aujourd'hui)
const maxRegistrationDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Date maximale pour les paiements (aujourd'hui)
const maxPaymentDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Date formatée pour les paiements
const formattedPaymentDate = computed(() => {
  if (!paymentFormData.value.date) return ''
  // Éviter les problèmes de fuseau horaire
  const date = new Date(paymentFormData.value.date)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
})

// Computed properties pour la date d'essai
const formattedTrialDate = computed(() => {
  if (!formData.trialDate) return ''
  // Éviter les problèmes de fuseau horaire
  const date = new Date(formData.trialDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
})

const minTrialDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Dates autorisées pour la date d'essai (basées sur les événements récurrents sélectionnés)
const allowedTrialDates = computed(() => {
  const allowedDates = new Set<string>()
  const now = new Date() // Utiliser l'heure actuelle, pas minuit

  formData.enrolledEvents.forEach(eventEnrollment => {
    if (typeof eventEnrollment === 'object' && (eventEnrollment.isRecurring || eventEnrollment.isAllOccurrences)) {
      const event = events.value.find(e => e._id === eventEnrollment.eventId)
      if (event && event.recurrence !== 'Aucune') {
        // Générer les occurrences futures de cet événement récurrent
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        const duration = eventEnd.getTime() - eventStart.getTime()

        let currentOccurrence = new Date(eventStart)
        const endDate = new Date(now)
        endDate.setFullYear(endDate.getFullYear() + 1) // 1 an dans le futur

        // Générer les occurrences jusqu'à la date de fin
        while (currentOccurrence <= endDate) {
          // Ne générer que les occurrences futures (en tenant compte de l'heure)
          if (currentOccurrence >= now) {
            // Éviter les problèmes de fuseau horaire en utilisant les méthodes locales
            const year = currentOccurrence.getFullYear()
            const month = String(currentOccurrence.getMonth() + 1).padStart(2, '0')
            const day = String(currentOccurrence.getDate()).padStart(2, '0')
            const dateString = `${year}-${month}-${day}`
            allowedDates.add(dateString)
          }

          // Calculer la prochaine occurrence
          switch (event.recurrence) {
            case 'Hebdomadaire':
              currentOccurrence.setDate(currentOccurrence.getDate() + 7)
              break
            case 'Toutes les 2 semaines':
              currentOccurrence.setDate(currentOccurrence.getDate() + 14)
              break
            case 'Mensuelle':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
              break
          }
        }
      }
    }
  })

  return Array.from(allowedDates).sort()
})

const hasRecurringEvents = computed(() => {
  // Ne pas afficher le champ si le membre est déjà venu (statuts "inscrit" ou "actif")
  if (formData.status === 'inscrit' || formData.status === 'actif') {
    return false
  }

  return formData.enrolledEvents.some(event => {
    if (typeof event === 'object') {
      // Vérifier si c'est un événement récurrent
      if (event.isRecurring || event.isAllOccurrences) {
        // Pour les événements récurrents, vérifier s'il y a encore des occurrences futures
        const eventObj = events.value.find(e => e._id === event.eventId)
        if (eventObj) {
          // Si c'est "toutes les occurrences", vérifier que l'événement a encore des dates futures
          if (event.isAllOccurrences) {
            const now = new Date()
            const eventEnd = new Date(eventObj.end)
            return eventEnd > now // L'événement n'est pas encore terminé
          }
          // Pour les occurrences spécifiques, vérifier que la date n'est pas passée
          else if (event.occurrenceDate) {
            const occurrenceDate = new Date(event.occurrenceDate)
            const now = new Date()
            return occurrenceDate > now
          }
          // Pour les événements récurrents sans date spécifique, vérifier la date de fin
          else {
            const now = new Date()
            const eventEnd = new Date(eventObj.end)
            return eventEnd > now
          }
        }
      }
    }
    return false
  })
})

const formatDate = (dateString: string) => {
  if (!dateString) return '-'

  // Éviter les problèmes de fuseau horaire en utilisant les méthodes locales
  const date = new Date(dateString)

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pré-inscrit': return 'warning'
    case 'inscrit': return 'info'
    case 'actif': return 'success'
    case 'inactif': return 'error'
    default: return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pré-inscrit': return 'Pré-inscrit'
    case 'inscrit': return 'Inscrit'
    case 'actif': return 'Actif'
    case 'inactif': return 'Inactif'
    default: return status
  }
}

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'warning'
    case 'Intermédiaire': return 'error'
    default: return 'primary'
  }
}

const getUpcomingEvents = (enrolledEvents: any[]) => {
  const now = new Date()
  const upcomingEvents: any[] = []

  enrolledEvents.forEach(enrollment => {
    // L'événement est maintenant directement dans enrollment.eventId (grâce au populate)
    const event = enrollment.eventId
    if (!event) return

    if (enrollment.isAllOccurrences) {
      // Pour "toutes les occurrences", ajouter l'événement avec un titre spécial
      upcomingEvents.push({
        ...event,
        title: `${event.title} (Toutes les occurrences)`,
        isAllOccurrences: true
      })
    } else if (enrollment.occurrenceDate) {
      // Pour une occurrence spécifique, vérifier si elle est à venir
      const occurrenceDate = new Date(enrollment.occurrenceDate)
      if (occurrenceDate > now) {
        upcomingEvents.push({
          ...event,
          title: `${event.title} - ${occurrenceDate.toLocaleDateString('fr-FR')}`,
          occurrenceDate: occurrenceDate,
          isSpecificOccurrence: true
        })
      }
    } else if (!enrollment.isRecurring) {
      // Pour un événement simple, vérifier s'il est à venir
      const eventDate = new Date(event.start)
      if (eventDate > now) {
        upcomingEvents.push({
          ...event,
          isSimpleEvent: true
        })
      }
    }
  })

  // Trier par date
  return upcomingEvents.sort((a, b) => {
    const dateA = a.occurrenceDate ? a.occurrenceDate : new Date(a.start)
    const dateB = b.occurrenceDate ? b.occurrenceDate : new Date(b.start)
    return dateA.getTime() - dateB.getTime()
  })
}

// Fonction pour calculer la prochaine occurrence d'un événement récurrent
const getNextOccurrenceDate = (event: any, member: Member) => {
  const now = new Date()

  // Si le membre est pré-inscrit et a une date d'essai future, utiliser cette date
  if (member.status === 'pré-inscrit' && member.intendedTrialDate) {
    const trialDate = new Date(member.intendedTrialDate)
    // Comparer en utilisant les méthodes locales pour éviter les problèmes de fuseau horaire
    if (trialDate.getTime() > now.getTime()) {
      return trialDate
    }
  }

  // Sinon, calculer la prochaine occurrence à partir d'aujourd'hui
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)
  const duration = eventEnd.getTime() - eventStart.getTime()

  let currentOccurrence = new Date(eventStart)
  const endDate = new Date(now)
  endDate.setFullYear(endDate.getFullYear() + 1) // 1 an dans le futur

  // Trouver la prochaine occurrence future
  while (currentOccurrence.getTime() <= endDate.getTime()) {
    if (currentOccurrence.getTime() >= now.getTime()) {
      return currentOccurrence
    }

    // Calculer la prochaine occurrence
    switch (event.recurrence) {
      case 'Hebdomadaire':
        currentOccurrence.setDate(currentOccurrence.getDate() + 7)
        break
      case 'Toutes les 2 semaines':
        currentOccurrence.setDate(currentOccurrence.getDate() + 14)
        break
      case 'Mensuelle':
        currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
        break
    }
  }

  return null
}

// Fonction pour générer le texte des événements dans le tooltip
const getEventsTooltipEventsText = (member: Member) => {
  const upcomingEvents = getUpcomingEvents(member.enrolledEvents || [])

  if (upcomingEvents.length === 0) {
    return 'Aucun événement à venir'
  }

  const firstEvent = upcomingEvents[0]
  let eventTitle = firstEvent.title

  // Si c'est un événement récurrent avec "Toutes les occurrences", calculer la prochaine date
  if (firstEvent.isAllOccurrences) {
    const nextOccurrence = getNextOccurrenceDate(firstEvent, member)
    if (nextOccurrence) {
      const nextDate = nextOccurrence.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
      eventTitle = `${firstEvent.title.replace(' (Toutes les occurrences)', '')} - ${nextDate}`
    }
  }

  if (upcomingEvents.length === 1) {
    return `Prochain: ${eventTitle}`
  } else {
    return `Prochain: ${eventTitle} (+ ${upcomingEvents.length - 1} autre${upcomingEvents.length > 2 ? 's' : ''})`
  }
}

// Fonction pour vérifier s'il y a une date de première visite future
const hasUpcomingTrialDate = (member: Member) => {
  const now = new Date()
  return member.intendedTrialDate && new Date(member.intendedTrialDate).getTime() > now.getTime()
}

// Fonction pour formater la date de première visite
const getFormattedTrialDate = (member: Member) => {
  if (!member.intendedTrialDate) return ''
  const trialDate = new Date(member.intendedTrialDate)
  return trialDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

const getPastCourses = (courses: any[]) => {
  const now = new Date()
  return courses
    .filter(course => new Date(course.start) <= now)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
}

// Méthode pour récupérer le nombre de membres d'une tranche d'âge spécifique
const getAgeGroupCount = (ageGroup: string) => {
  if (!stats.value?.ageDistribution) return 0
  const group = stats.value.ageDistribution.find(item => item._id === ageGroup)
  return group?.count || 0
}

// Fonction utilitaire pour formater l'heure
const timeShort = (dateString: string | Date) => {
  const date = new Date(dateString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}


// Méthodes pour les règlements intérieurs
const loadActiveRules = async () => {
  try {
    const response = await api.getData<InternalRules>('/internal-rules/active')
    activeRules.value = response
  } catch (error: any) {
    if (error.response?.status !== 404) {
      console.error('Erreur lors du chargement du règlement actif:', error)
    }
    activeRules.value = null
  }
}

const loadRulesHistory = async () => {
  try {
    const response = await api.getData<InternalRules[]>('/internal-rules')
    rulesHistory.value = response
  } catch (error: any) {
    console.error('Erreur lors du chargement de l\'historique des règlements:', error)
    rulesHistory.value = []
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const openRulesUploadModal = () => {
  // Réinitialiser le formulaire
  Object.assign(rulesFormData, {
    title: 'Règlement Intérieur',
    version: '',
    description: '',
    file: null
  })
  rulesFileError.value = ''
  showRulesUploadModal.value = true
}

const closeRulesUploadModal = () => {
  showRulesUploadModal.value = false
  Object.assign(rulesFormData, {
    title: 'Règlement Intérieur',
    version: '',
    description: '',
    file: null
  })
  rulesFileError.value = ''
}

const openRulesHistoryModal = async () => {
  showRulesHistoryModal.value = true
  await loadRulesHistory()
}

const uploadRules = async () => {
  try {
    rulesFileError.value = ''

    // Validation
    if (!rulesFormData.version) {
      showError('Veuillez saisir une version')
      return
    }

    if (!rulesFormData.file) {
      rulesFileError.value = 'Veuillez sélectionner un fichier PDF'
      return
    }

    // Gérer le cas où file est un array ou un seul fichier
    let file
    if (Array.isArray(rulesFormData.file)) {
      if (rulesFormData.file.length === 0) {
        rulesFileError.value = 'Veuillez sélectionner un fichier PDF'
        return
      }
      file = rulesFormData.file[0]
    } else {
      file = rulesFormData.file
    }

    if (!file) {
      rulesFileError.value = 'Fichier invalide'
      return
    }

    if (file.type !== 'application/pdf') {
      rulesFileError.value = 'Seuls les fichiers PDF sont acceptés'
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      rulesFileError.value = 'Le fichier ne peut pas dépasser 10MB'
      return
    }

    uploadingRules.value = true

    // Préparer les données pour l'upload
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('version', rulesFormData.version)
    formData.append('title', rulesFormData.title)
    if (rulesFormData.description) {
      formData.append('description', rulesFormData.description)
    }

    const response = await api.postFormData<InternalRules>('/internal-rules/upload', formData)

    activeRules.value = response
    showSuccess('Règlement intérieur uploadé avec succès')
    closeRulesUploadModal()

    // Recharger l'historique si le modal est ouvert
    if (showRulesHistoryModal.value) {
      await loadRulesHistory()
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'upload du règlement:', error)

    if (error.response?.data?.message) {
      showError(error.response.data.message)
    } else {
      showError('Erreur lors de l\'upload du règlement intérieur')
    }
  } finally {
    uploadingRules.value = false
  }
}

const downloadRules = async (rules: InternalRules) => {
  try {
    const response = await api.getData<{ downloadUrl: string, filename: string }>(`/internal-rules/${rules._id}/download`)

    // Ouvrir le lien de téléchargement dans un nouvel onglet
    window.open(response.downloadUrl, '_blank')
  } catch (error: any) {
    console.error('Erreur lors du téléchargement:', error)
    showError('Erreur lors du téléchargement du règlement')
  }
}

const setActiveRules = async (rules: InternalRules) => {
  try {
    await api.postData(`/internal-rules/${rules._id}/set-active`, {})

    showSuccess(`Règlement version ${rules.version} défini comme actuel`)

    // Recharger les données
    await loadActiveRules()
    await loadRulesHistory()
  } catch (error: any) {
    console.error('Erreur lors de la définition du règlement actif:', error)
    showError('Erreur lors de la mise à jour du règlement actif')
  }
}

const deleteRulesVersion = async (rules: InternalRules) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la version ${rules.version} du règlement intérieur ? Cette action est irréversible.`)) {
    return
  }

  try {
    await api.delete(`/internal-rules/${rules._id}`)

    showSuccess(`Version ${rules.version} supprimée avec succès`)

    // Recharger l'historique
    await loadRulesHistory()
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)

    if (error.response?.data?.message) {
      showError(error.response.data.message)
    } else {
      showError('Erreur lors de la suppression du règlement')
    }
  }
}

// Watchers
watch(currentPage, () => {
  loadMembers()
})

watch(filters, (newFilters) => {
  console.log('Watcher filters déclenché:', newFilters) // Debug
  currentPage.value = 1
  loadMembers()
}, { deep: true })

// Watcher pour gérer automatiquement la date d'inscription selon le statut
watch(() => formData.status, (newStatus) => {
  if (newStatus === 'inscrit') {
    // Si le statut est "Inscrit", mettre la date du jour
    formData.registrationDate = new Date().toISOString().split('T')[0]
  } else {
    // Si le statut n'est pas "Inscrit", vider le champ
    formData.registrationDate = ''
  }
})

// Watcher pour détecter le paramètre 'view' dans l'URL
watch(() => route.query.view, (memberId) => {
  if (memberId && typeof memberId === 'string') {
    // Attendre que les membres soient chargés avant d'ouvrir la modale
    if (members.value.length > 0) {
      openViewById(memberId)
    }
  }
}, { immediate: true })

// Watcher pour nettoyer l'URL quand la modale se ferme
watch(showViewModal, (isOpen) => {
  if (!isOpen && route.query.view) {
    // Nettoyer l'URL en supprimant le paramètre 'view'
    const query = { ...route.query }
    delete query.view
    router.replace({ query })
  }
})

// Initialisation
onMounted(() => {
  loadMembers()
  loadStats()
  loadEvents()
  loadActiveRules()
})
</script>

<style>
@import '@/assets/members-view.css';

.payment-method-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.payment-method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.payment-method-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary-container));
}

/* Styles pour la sélection d'événements */
.events-selection {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 8px;
  padding: 16px;
  background: rgb(var(--v-theme-surface-variant));
}

.selected-events-display {
  min-height: 40px;
  padding: 8px;
  background: rgb(var(--v-theme-surface));
  border-radius: 4px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.no-events {
  color: rgb(var(--v-theme-on-surface-variant));
  font-style: italic;
  text-align: center;
  padding: 8px;
}

.selected-events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Styles pour le tooltip amélioré */
.tooltip-content {
  text-align: left;
  line-height: 1.4;
}

.tooltip-events {
  margin-bottom: 8px;
  font-weight: 500;
}

.tooltip-trial-date {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  padding-top: 4px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}
</style>
