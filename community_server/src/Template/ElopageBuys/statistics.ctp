<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//var_dump($elopageBuys->toArray());
/*foreach($elopageBuys as $entry) {
  echo $entry->success_date . "<br>";
}
 * 
 */
/*foreach($users as $user) {
  //var_dump($user);
  echo $user->created;
  echo "<br>";
}*/
?>
<div class="row">
  <div class="col-md-5 order-md-0">
    <div class="row">
      <div class="col-6 equel-grid">
        <div class="grid d-flex flex-column align-items-center justify-content-center">
          <div class="grid-body text-center">
            <div class="profile-img img-rounded bg-inverse-primary no-avatar component-flat mx-auto mb-4"><i class="mdi mdi-account-group mdi-2x"></i></div>
            <h2 class="font-weight-medium"><span class="animated-count"><?= $users->count()?></span></h2>
            <small class="text-gray d-block mt-3"><?= __('Anmeldungen diesen Monat'); ?></small>
            <small class="font-weight-medium text-success"><i class="mdi mdi-menu-up"></i><span class="animated-count">12.01</span>%</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>