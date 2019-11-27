<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->assign('title', __('Kontoübersicht'));
?>
<div class="row">
              <div class="col-md-10 equel-grid">
                <div class="grid">
                  <div class="grid-body py-3">
                    <p class="card-title ml-n1">Überweisungen</p>
                  </div>
                  <div class="table-responsive">
                    <table class="table table-hover table-sm">
                      <thead>
                        <tr class="solid-header">
                          <th colspan="2" class="pl-4">Absender</th>
                          <th>Transaktions Nr.</th>
                          <th>Datum</th>
                          <th>Betrag</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="pr-0 pl-4">
                            <?= $this->Html->image('50x50.png', ['class' => 'profile-img img-sm', 'alt' => 'profile image']) ?>
                          </td>
                          <td class="pl-md-0">
                            <small class="text-black font-weight-medium d-block">Barbara Curtis</small>
                            <span>
                              <span class="status-indicator rounded-indicator small bg-primary"></span>Account Deactivated </span>
                          </td>
                          <td>
                            <small>8523537435</small>
                          </td>
                          <td> Just Now </td>
                          <td>120</td>
                        </tr>
                        <tr>
                          <td class="pr-0 pl-4">
                            <?= $this->Html->image('50x50.png', ['class' => 'profile-img img-sm', 'alt' => 'profile image']) ?>
                          </td>
                          <td class="pl-md-0">
                            <small class="text-black font-weight-medium d-block">Charlie Hawkins</small>
                            <span>
                              <span class="status-indicator rounded-indicator small bg-success"></span>Email Verified </span>
                          </td>
                          <td>
                            <small>9537537436</small>
                          </td>
                          <td> Mar 04, 2018 11:37am </td>
                          <td>-120</td>
                        </tr>
                        <tr>
                          <td class="pr-0 pl-4">
                            <?= $this->Html->image('50x50.png', ['class' => 'profile-img img-sm', 'alt' => 'profile image']) ?>
                          </td>
                          <td class="pl-md-0">
                            <small class="text-black font-weight-medium d-block">Nina Bates</small>
                            <span>
                              <span class="status-indicator rounded-indicator small bg-warning"></span>Payment On Hold </span>
                          </td>
                          <td>
                            <small>7533567437</small>
                          </td>
                          <td> Mar 13, 2018 9:41am </td>
                          <td>10</td>
                        </tr>
                        <tr>
                          <td class="pr-0 pl-4">
                            <?= $this->Html->image('50x50.png', ['class' => 'profile-img img-sm', 'alt' => 'profile image']) ?>
                          </td>
                          <td class="pl-md-0">
                            <small class="text-black font-weight-medium d-block">Hester Richards</small>
                            <span>
                              <span class="status-indicator rounded-indicator small bg-success"></span>Email Verified </span>
                          </td>
                          <td>
                            <small>5673467743</small>
                          </td>
                          <td> Feb 21, 2018 8:34am </td>
                          <td>500</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <a class="border-top px-3 py-2 d-block text-gray" href="#"><small class="font-weight-medium"><i class="mdi mdi-chevron-down mr-2"></i>View All Order History</small></a>
                </div>
              </div>
            </div>