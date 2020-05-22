<?php
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
namespace Model\Navigation;

use Cake\Routing\Router;

class NaviEntryAbsoluteLink extends NaviEntryBase
{
    protected $link = '';
    protected $active = '';
    protected $iconClass = '';
    protected $iconColor = '';
    protected $bgColorClass = '';

    public function __construct($title, $iconClass, $link, $active = null)
    {
          $this->link = $link;
          $this->iconClass = $iconClass;
        if ($active != null) {
            $this->active = $active;
        }
          $this->title = $title;
          return $this;
    }

    public function setIconColor($iconColorClass)
    {
        $this->iconColor = $iconColorClass;
        return $this;
    }

    public function setBGColor($bgColorClass)
    {
        $this->bgColorClass = $bgColorClass;
        return $this;
    }

    private function isActive()
    {
        return $this->active;
    }

    protected function link()
    {
        $self = $GLOBALS["self"];
        if ($this->hasChilds()) {
            return $self->Html->link(
              $this->title.'<span class="caret"></span>',
              ['controller' => $this->controller, "action" => $this->action, $this->param],
              ['escape' => false]
            );
        } else {
            return '<a href="' . Router::url('./', true). $this->link.'" class="' .$this->bgColorClass .'" >'
                  . '<i class="material-icons-outlined ' . $this->iconColor .'">'. $this->iconClass .'</i>'
                  . '<span class="link-title">' . $this->title . '</span>'
                . '</a>';
        }
    }

    public function __toString()
    {
        $str = "";
        $str .= "<li";
        $class = "";
        if ($this->hasChilds()) {
            $class .= "dropdown";
        }
        if ($this->isActive()) {
            $class .= " active";
        }
        if (strlen($class) > 0) {
            $str .= " class='$class'";
        }
        $str .=  ">";

        $str .=  $this->link();
        if ($this->hasChilds()) {
            $str .= "<ul class='subnav'>";
            foreach ($this->childs as $child) {
                $str .= $child;
            }
            $str .= "</ul>";
        }
        $str .= "</li>";
        return $str;
    }
}
