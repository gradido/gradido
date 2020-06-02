<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

/**
* Navigation Hierarchy Entry
*
* Each navigation hierarchy entry needs the fields "name", "controller" and
* "action".
*
* @author Christine Slotty <christine.slotty@software-labor.de>
*/
class NaviHierarchyEntry
{
    private $name;
    private $controller;
    private $action;
    public function __construct($name, $controller, $action, $isLast)
    {
        $this->name = $name;
        $this->controller = $controller;
        $this->action = $action;
        $this->isLast = $isLast;
        return $this;
    }
    private function link()
    {
        $self = $GLOBALS["self"];
        return $self->Html->Link(
            '<span class="link-title">' . $this->name . '</span>',
            ['controller' => $this->controller, 'action' => $this->action],
            ['class' => "", 'escape' => false]
        );
    }

    public function __toString()
    {
        $str = "<li";
        if ($this->isLast){
            $str .= " class='selected'";
        }
        $str .= ">";
        $str .=  $this->link();
        $str .= "</li>";
        return $str;
    }
}
