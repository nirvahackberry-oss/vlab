import { MdHome, MdAddCard, MdLibraryBooks } from 'react-icons/md';

export const SIDEBAR_ITEMS = [
  { icon: MdHome, label: 'Dashboard', active: true, path: '/' },
  { icon: MdLibraryBooks, label: 'Catalogue', path: '/admin/catalogue' },
  { icon: MdAddCard, label: 'Add Credit', path: '/add-credit' },
];
