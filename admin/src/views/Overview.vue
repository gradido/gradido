<template>
  <div>
    <b-card
      border-variant="primary"
      header="offene Schöpfungen"
      header-bg-variant="danger"
      header-text-variant="white"
      align="center"
    >
      <b-card-text>
        <b-link to="creation-confirm"><h1>3</h1></b-link>
      </b-card-text>
    </b-card>
    <br />
    <b-row>
      <b-col>
        <b-card border-variant="info" header="offene Registrierung" align="center">
          <b-card-text>Unbestätigte E-mail Registrierung</b-card-text>
        </b-card>
      </b-col>
      <b-col>
        <b-card border-variant="info" header="geschöpfte Stunden" align="center">
          <b-card-text>Wievile Stunden können noch von Mitgliedern geschöpft werden?</b-card-text>
        </b-card>
      </b-col>
      <b-col>
        <b-card border-variant="info" header="Gemeinschafts Konto" align="center">
          <b-card-text>
            Für jedes Mitglied kann für das Gemeinschaftskonto geschöpft werden. Pro Monat 1000 x
            Mitglieder
          </b-card-text>
        </b-card>
      </b-col>
    </b-row>
    <hr />
    <br />
    <b-list-group>
      <b-list-group-item class="bg-secondary text-light" href="user">
        zur Usersuche
      </b-list-group-item>
      <b-list-group-item class="d-flex justify-content-between align-items-center">
        Mitglieder
        <b-badge class="bg-success" pill>14</b-badge>
      </b-list-group-item>

      <b-list-group-item class="d-flex justify-content-between align-items-center">
        aktive Mitglieder
        <b-badge class="bg-primary" pill>12</b-badge>
      </b-list-group-item>

      <b-list-group-item class="d-flex justify-content-between align-items-center">
        nicht bestätigte Mitglieder
        <b-badge class="bg-warning text-dark" pill>2</b-badge>
      </b-list-group-item>
    </b-list-group>
    <hr />
    <br />
    <div class="text-center">
      Gradido Akademie Adminkonsole
      <div><small>Version: 0.0.1</small></div>
    </div>
    <br />
    <br />
    <hr />
  </div>
</template>
<script>
export default {
  name: 'overview',
}
</script>
