<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;


class TitleOnly extends NaviEntryBase {
  public function __construct($title) {
    $this->title = $title;
  }
  
  public function __toString() {
    $str = "";
        $str .= "<li";
        $class = "";
        if($this->hasChilds()) { $class .= " dropdown";}
        if(strlen($class) > 0 ) $str .= " class='$class'";
        $str .=  ">";
        $hNumber = 1;
        if($this->isChild) $hNumber = 3;
        $str .= "<h$hNumber><span class='block-btn'>" . $this->title . "</span></h$hNumber>";
        if($this->hasChilds()) {
            $str .= "<ul class='subnav'>";
            foreach($this->childs as $child) {
                $str .= $child;
            }
            $str .= "</ul>";
        }
        $str .= "</li>";
        return $str;
  }
}
