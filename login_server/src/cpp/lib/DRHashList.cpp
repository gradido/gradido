//------------------------------------------------------------------
//	hash list implementation
//------------------------------------------------------------------

#include "DRHashList.h"

#include <memory>
#include <cstring>

using namespace std;

//------------------------------------------------------------------
//	DRStaticHashList
//	set the data
//------------------------------------------------------------------
void DRStaticHashList::setData( u32 nItems, DRHashListItem *pItems)
{
	m_nItems = nItems;
	m_pItems = pItems;
}

//------------------------------------------------------------------
//	DRStaticHashList
//	does an item exist
//------------------------------------------------------------------
bool DRStaticHashList::itemExists( DHASH hashValue, u32 *outIndex ) const
{
	s32		window[3];

	// empty???
	if( m_nItems==0 )
		return false;

	// simple binary search
	// divide and conquer is maybe faster?
	window[0] = 0;
	window[2] = m_nItems-1;
	while( window[0]<=window[2] )
	{
		window[1] = (window[0]+window[2])/2;

		// is this the item we're looking for?
		if( m_pItems[window[1]].hashValue==hashValue )
		{
			if( outIndex )
				outIndex[0] = window[1];
			return true;
		}

		// check whether to search top or bottom half of list
		if( m_pItems[window[1]].hashValue<hashValue )
			window[0] = window[1]+1;
		else
			window[2] = window[1]-1;
	}

	return false;
}

//------------------------------------------------------------------
//	DRStaticHashList
//	find an entry by hash
//------------------------------------------------------------------
void *DRStaticHashList::findByHash( DHASH hashValue ) const
{
	s32		window[3];

	// empty???
	if( m_nItems==0 )
		return 0;

	// simple binary search
	// divide and conquer is maybe faster?
	window[0] = 0;
	window[2] = m_nItems-1;
	while( window[0]<=window[2] )
	{
		window[1] = (window[0]+window[2])/2;

		// is this the item we're looking for?
		if( m_pItems[window[1]].hashValue==hashValue )
			return m_pItems[window[1]].data;

		// check whether to search top or bottom half of list
		if( m_pItems[window[1]].hashValue<hashValue )
			window[0] = window[1]+1;
		else
			window[2] = window[1]-1;
	}

	return 0;
}

//------------------------------------------------------------------
//	DRStaticHashList
//	find an entry by index
//------------------------------------------------------------------
void *DRStaticHashList::findByIndex( u32 index ) const
{
	if( index>=m_nItems )
		return 0;
	return m_pItems[index].data;
}

//------------------------------------------------------------------
//	DRStaticHashList
//	find a hash by index
//------------------------------------------------------------------
DHASH DRStaticHashList::findHashByIndex( u32 index ) const
{
	if( index>=m_nItems )
		return 0;
	return m_pItems[index].hashValue;
}

void DRStaticHashList::setDataByIndex(u32 index, void* data)
{
	if (index >= m_nItems)
		return;
	m_pItems[index].data = data;
}

//------------------------------------------------------------------
//	DRStaticHashList
//	find the index where a given hash value should go
//	this is very similar to the FindByHash routine
//------------------------------------------------------------------
u32 DRStaticHashList::findIndexForHash( DHASH hashValue )
{
	s32		window[3];

	if( m_nItems==0 )
		return 0;

	// simple binary search
	// divide and conquer is maybe faster?
	window[0] = 0;
	window[2] = m_nItems-1;
	while( window[0]<=window[2] )
	{
		window[1] = (window[0]+window[2])/2;

		// is this the item we're looking for?
		if( m_pItems[window[1]].hashValue==hashValue )
			return window[1];

		// check whether to search top or bottom half of list
		if( m_pItems[window[1]].hashValue<hashValue )
			window[0] = window[1]+1;
		else
			window[2] = window[1]-1;
	}

	// do we belong after this item?
	if( m_pItems[window[1]].hashValue<hashValue )
		window[1]++;
	return window[1];
}

//------------------------------------------------------------------
//	DRHashList
//	sort items (static member function)
//------------------------------------------------------------------
#ifdef _WIN32
int __cdecl hashSortFn( const void *a, const void *b )
#else
int hashSortFn( const void *a, const void *b )
#endif
{
	if( (((DRHashListItem*)a)->hashValue) > (((DRHashListItem*)b)->hashValue) )
		return 1;
	if( (((DRHashListItem*)a)->hashValue) < (((DRHashListItem*)b)->hashValue) )
		return -1;
	return 0;
}

void	DRHashList::sortItems( u32 numItems, DRHashListItem *pItems )
{
	qsort(pItems,numItems,getSizeOfItem(),hashSortFn);
}

//------------------------------------------------------------------
//	DRHashList
//	destructor
//------------------------------------------------------------------
DRHashList::~DRHashList()
{
	clear(true);
}

//------------------------------------------------------------------
//	DRHashList
//	clear the hash list out
//------------------------------------------------------------------
void DRHashList::clear( bool freeMemory )
{
	m_nItems = 0;
	if( freeMemory && m_pItems )
	{
		m_maxItems = 0;
		free(m_pItems);
		m_pItems = 0;
	}
}



//------------------------------------------------------------------
//	DRHashList
//	add an item to the DRHashList
//------------------------------------------------------------------
bool DRHashList::addByHash( DHASH hashValue, void *pData )
{
	u32				toIndex;
	DRHashListItem	*pMe;

	// find where this hashValue goes
	toIndex = findIndexForHash(hashValue);

	// is an item with this hash already here?
	if( toIndex!=m_nItems && m_pItems[toIndex].hashValue==hashValue )
		return false;

	// create room in the hash table
	if( m_nItems==m_maxItems )
	{	// need to reallocate some data
		m_maxItems += 32;	// allocate some more items
		m_pItems = (DRHashListItem*)realloc(m_pItems,m_maxItems*getSizeOfItem());
	}

	pMe = &m_pItems[toIndex];

	// make a hole for me to go
	if( toIndex!=m_nItems )
	{
		memmove( &pMe[1],pMe,(m_nItems-toIndex)*getSizeOfItem());
	}

	pMe->hashValue = hashValue;
	pMe->data = pData;

	m_nItems++;
	return true;

}

void DRHashList::resize(u32 newSize)
{
	if (newSize > m_maxItems) {
		m_maxItems = newSize;
		if (m_pItems) {
			m_pItems = (DRHashListItem*)realloc(m_pItems, m_maxItems*getSizeOfItem());
		}
		else {
			m_pItems = (DRHashListItem *)malloc(m_maxItems*getSizeOfItem());
		}
	}
}

//------------------------------------------------------------------
//	DRHashList
//	remove an item to the DRHashList
//------------------------------------------------------------------
bool DRHashList::removeByHash( DHASH hashValue )
{
	u32				toIndex;

	// find where this hashValue goes
	toIndex = findIndexForHash(hashValue);

	// is an item with this hash here?
	if( toIndex==m_nItems || m_pItems[toIndex].hashValue!=hashValue )
		return false;

	// remove this item from the list
	m_nItems-=1;
	if( toIndex!=m_nItems )
	{
		memmove(&m_pItems[toIndex],&m_pItems[toIndex+1],(m_nItems-toIndex)*getSizeOfItem());
	}
	return true;
}
