<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
?>
<div class="grd_container_small">
  <table>
    <thead>
      <tr>
        <th>first name</th><th>last name</th><th>email</th><th>identHash</th><th>Public key hex
      </tr>
    </thead>
    <tbody>

  <?php foreach($stateUsers as $user) :?>    
      <tr>
        <td><?= $user->first_name ?></td>
        <td><?= $user->last_name ?></td>
        <td><?= $user->email ?></td>
        <td><?= $user->identHash ?></td>
        <td><?= bin2hex(stream_get_contents($user->public_key)) ?></td>
      </tr>
  <?php endforeach; ?>
    </tbody>
  </table>
</div>
