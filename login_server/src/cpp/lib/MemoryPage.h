/*/*************************************************************************
*                                                                         *
* Core, Core-Lib for my programs, Core doesn't need any libraries	   *
* Copyright (C) 2012, 2013, 2014 Dario Rekowski                           *
* Email: ***REMOVED***   Web: ***REMOVED***                *
*                                                                         *
* This program is free software: you can redistribute it and/or modify    *
* it under the terms of the GNU General Public License as published by    *
* the Free Software Foundation, either version 3 of the License, or       *
* any later version.                                                      *
*									   *
* This program is distributed in the hope that it will be useful,	   *
* but WITHOUT ANY WARRANTY; without even the implied warranty of	   *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the	   *
* GNU General Public License for more details.				   *
*									   *
* You should have received a copy of the GNU General Public License	   *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
*                                                                         *
***************************************************************************/

/*
Speichermanager mit Free Listen
Damit man häufig Speicher reservieren kann ohne den
Speicher zu defragmentieren.
Nach einem Artikel aus Gems4: "Speicherfragmentierung mit Templated Free-Lists bekämmpfen"
von Paul Glinker Rockstar Games Toronto

Programmierer: Dario Rekowski

	@date 01.11.2019

	removed template, use malloc and size


*/
//DRLogger Log;
//Deklaration
//#ifdef _TEMPLATEFREE_
#ifndef __DR_CORE2_MEMORY_LIST2__
#define __DR_CORE2_MEMORY_LIST2__

#include "Poco/Types.h"

class MemoryPage
{

public:
	//Standard Konstruktor
	MemoryPage(Poco::UInt16 iNumObjects, Poco::UInt16 objectSize);


	//Deskonstruktor, wichtig!!
	~MemoryPage();

	//füllt den Zeigerstack (Stapel)
	void FillStack();

	//Liefert den Zeiger auf einen freien Spiecherplatz zurück
	unsigned char* NewInstance();

	//Und die Instance freigeben
	void FreeInstance(unsigned char* pInstance);

	//liefert die anzahl der noch freien Speicherplätze zurück
	Poco::UInt16 getFreeCount() { return m_iTop; }
	Poco::UInt16 getObjectCount() { return m_iNumObject; }
	

private:
	unsigned char*	m_pObjectData;		//Zeiger auf den reservieretn Speicher
	unsigned char**	m_ppFreeObjects;	//Zeiger auf die anderen Zeiger
	Poco::UInt16	m_iNumObject;		//Anzahl der Objecte
	Poco::UInt16	m_iTop;				//Keine Ahnung
	Poco::UInt16    m_size;
};


//******************************************************************************++
//Funktionen

#endif //__DR_CORE2_MEMORY_LIST2__
//#endif //_TEMPLATEFREE_