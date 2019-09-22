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

//---------------------------------------------------------
//	hash list definition
// aus dem Buch "Goldene Regeln der Spieleprogrammierung" von Martin Brownlow
//---------------------------------------------------------
#ifndef __DR_CORE2_HASH_LIST__
#define __DR_CORE2_HASH_LIST__

#include "DRHash.h"

//---------------------------------------------------------
//	an item in the hash list
//---------------------------------------------------------
class DRHashListItem
{
public:
	DHASH	hashValue;
	void	*data;
};

//---------------------------------------------------------
//	static hash list implementation
//---------------------------------------------------------
class  DRStaticHashList
{
public:
	DRStaticHashList() : m_nItems(0),m_pItems(0) { /*empty*/ }
	~DRStaticHashList()	{ /*empty*/ }

	void		setData( u32 nItems, DRHashListItem *pItems);
	const void	*getData() const		{	return m_pItems;						}
	u32			getDataSize( ) const	{	return m_nItems*sizeof(DRHashListItem);	}
	u32			getNItems( ) const		{	return m_nItems;						}

	void		*findByHash( DHASH hashValue ) const;
	void		*findByIndex( u32 index ) const;
	DHASH		findHashByIndex( u32 index ) const;
	void		setDataByIndex(u32 index, void* data);
	bool		itemExists( DHASH hashValue, u32 *outIndex=0 ) const;

	

protected:
	// find the index where a hash value should go
	u32			findIndexForHash( DHASH hashValue );
	inline static size_t getSizeOfItem() {return sizeof(DRHashListItem);}

protected:
	u32				m_nItems;
	DRHashListItem	*m_pItems;
};

//---------------------------------------------------------
//	general case hash list implementation
//---------------------------------------------------------
class DRHashList : public DRStaticHashList
{
public:
	static void	sortItems( u32 numItems, DRHashListItem *pItems );

public:
	DRHashList() : DRStaticHashList(), m_maxItems(0) { /*empty*/ }
	~DRHashList();

	// inherited functionality
	//void	*FindByHash( DHASH hashValue ) const;

	// clear the list
	void	clear( bool freeMemory=false );

	// functions by hash
	bool	addByHash( DHASH hashValue, void *pData );
	bool	removeByHash( DHASH hashValue );

	void        resize(u32 newSize);

	// functions by type
	template <class X>
	inline	bool	add( X *pData )
	{
		return addByHash(pData->makeHash(),pData);
	}

	template <class X>
	inline	bool	remove( const X *pData )
	{
		return removeByHash(pData->makeHash());
	}

protected:

	u32				m_maxItems;
};


#endif //__DR_CORE2_HASH_LIST__
