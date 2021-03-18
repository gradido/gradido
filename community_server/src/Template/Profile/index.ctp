<?php
use Cake\Routing\Router;
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$header = '<div>';
$header .= '<h1 class="inline-header">'.$user['first_name'] . '&nbsp;' . $user['last_name'] . '</h1>';
if (!empty($communityProfile['profile_desc'])) {
  $header .= "<p>".$communityProfile['profile_desc']."</p>";
}
$header .= '</div>';
if ($communityProfile && $communityProfile['profile_img']) {
  $header .= "<div><img
        class='show-profile-img'
        src='data:image/*;base64,".base64_encode($communityProfile['profile_img'])."'/></div>";
}
$this->assign('title', __('Mein Profil'));
$this->assign('header', $header);
?>
<?php if(isset($requestTime)) : ?>
<span><?= round($requestTime * 1000.0) ?> ms</span>
<?php endif; ?>
<div class="content-region">
  <h3>
    <i class="material-icons-outlined user-info">assignment_ind</i>
    Meine Daten
  </h3>
  <div class="content-collection">
    <ul class="fact-list">
      <li class="fact">
        <span class="fact label">E-Mail Adresse:</span>
        <span class="fact"><?=$user['email']?></span>
      </li>
      <li class="fact">
        <span class="fact label">Vorname:</span>
        <span class="fact"><?=$user['first_name']?></span>
      </li>
      <li class="fact">
        <span class="fact label">Nachname:</span>
        <span class="fact"><?=$user['last_name']?></span>
      </li>
      <li class="fact">
        <span class="fact label"></span>
        <span class="fact">
          <a class="link-button action-link-button" href="/profile/edit">Meine Daten ändern</a>
        </span>
      </li>
    </ul>
  </div>
  <!--<h3>
    <i class="material-icons-outlined user-info success">check_circle</i>
    Zustand meines Kontos
  </h3>
  <div class="content-collection">
    <ul class="fact-list">
      <li class="fact">
        <span class="fact label">Konto auf dem Login Server:</span>
        <span class="fact">???</span>
      </li>
      <li class="fact">
        <span class="fact label">??? :</span>
        <span class="fact"></span>
      </li>
    </ul>
  </div>-->
  <h3>
    <i class="material-icons-outlined user-info">vpn_key</i>
    Passwort ändern
  </h3>
  <div class="content-collection">
    <ul class="fact-list">
      <li class="fact">
        <span class="fact label">Passwort ändern:</span>
        <span class="fact">
          <a class="action-link" href="/account/updateUserPassword" target="_blank">zum Ändern anklicken! (öffnet in neuem Tab)</a>
        </span>
      </li>
    </ul>
  </div>
</div>
