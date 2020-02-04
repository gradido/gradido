<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

class NaviEntrySub extends NaviEntryBase {
    private $controller = '';
    private $action = '';
    private $active = '';
    private $param = null;
    private $iconClass = '';
    private $iconColor = '';
    private $bgColorClass = '';
    private $subtitle = '';
    
    public function __construct($title, $subtitle, $iconClass, $controller, $action, $active = null, $param = null) {
        
        $this->controller = $controller;
        $this->action = $action;
        $this->param = $param;
        $this->iconClass = $iconClass;
        if($active != null) {
            $this->active = $active;
        } else {
            $this->active = ($GLOBALS["side"] == $controller && 
                             $GLOBALS["subside"] == $action && 
                             $GLOBALS["passed"] == $param);
        }
        $this->title = $title;
        $this->subtitle = $subtitle;
        return $this;
    }
    
    public function setIconColor($iconColorClass) {
      $this->iconColor = $iconColorClass;
      return $this;
    }
    public function setBGColor($bgColorClass) {
      $this->bgColorClass = $bgColorClass;
      return $this;
    }
    private function isActive() {
        return $this->active;
    }
   
    
    
    private function link() {
        //global $self;
        //echo "<i>self: </i>"; var_dump($GLOBALS("self"));
        $self = $GLOBALS["self"];
        if($this->hasChilds()) {
            return $self->Html->link($this->title.'<span class="caret"></span>', ['controller' => $this->controller, "action" => $this->action, $this->param], ['escape' => false]);
        } else {
            //return $self->Html->link($this->title, ['controller' => $this->controller, "action" => $this->action, $this->param]);
          return $self->Html->Link(
                    ''
                    .'<span class="link-title">' . $this->title . '</span>'
                    .'<i class="mdi '. $this->iconClass .' link-icon ' . $this->iconColor .'"></i>'
                    //.'<small class="text-muted">' . $this->subtitle . '</small>'
                    , 
                    ['controller' => $this->controller, 'action' => $this->action, $this->param], 
                    ['class' => $this->bgColorClass, 'escape' => false]);
        }
    }
    
    public function __toString() {
        $str = "";
        $str .= "<li";
        $class = "";
        if($this->hasChilds()) { $class .= "dropdown";}
        if($this->isActive()) { $class .= " active"; }
        if(strlen($class) > 0 ) $str .= " class='$class'";
        $str .=  ">";
        
        $str .= '<small class="text-muted">'. $this->subtitle .'</small>';
        $str .=  $this->link();
        
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