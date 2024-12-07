"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/components/supabase-provider";

interface Contact {
  id: string;
  name: string;
  whatsapp: string;
  bot_enabled: boolean;
  created_at: string;
  updated_at: string;
}

type DateFilter = "all" | "today" | "week" | "month";

export default function ContactsDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const { user } = useSupabase();

  function formatPhoneNumber(number: string): string {
    if (!number) {
      return "";
    }
    const digitsOnly = String(number).replace(/\D/g, "");
    let localNumber = digitsOnly;
    if (localNumber.startsWith("55")) {
      localNumber = localNumber.substring(2);
    }
    const areaCode = localNumber.substring(0, 2);
    const phoneNumber = localNumber.substring(2);
    let formattedNumber = "";
    if (phoneNumber.length === 9) {
      formattedNumber = phoneNumber.replace(/^(\d)(\d{4})(\d{4})$/, "$1 $2-$3");
    } else if (phoneNumber.length === 8) {
      formattedNumber = phoneNumber.replace(/^(\d{4})(\d{4})$/, "$1-$2");
    } else {
      formattedNumber = phoneNumber;
    }
    return `(${areaCode}) ${formattedNumber}`;
  }

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      fetchContacts();
    }
  }, [user, router]);

  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contacts").select("*");

    if (error) {
      console.error("Error fetching contacts:", error);
    } else {
      setContacts(data || []);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (contactToDelete) {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactToDelete.id);

      if (error) {
        console.error("Error deleting contact:", error);
      } else {
        await fetchContacts();
        setDeleteModalOpen(false);
        setContactToDelete(null);
      }
    }
  };

  const handleBotToggle = async (contact: Contact, checked: boolean) => {
    const { error } = await supabase
      .from("contacts")
      .update({ bot_enabled: checked })
      .eq("id", contact.id);

    if (error) {
      console.error("Error updating contact:", error);
    } else {
      await fetchContacts();
    }
  };

  const applyFilters = () => {
    let result = contacts;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          String(contact.whatsapp).includes(query)
      );
    }

    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    switch (dateFilter) {
      case "today":
        result = result.filter(
          (contact) => new Date(contact.updated_at) >= today
        );
        break;
      case "week":
        result = result.filter(
          (contact) => new Date(contact.updated_at) >= oneWeekAgo
        );
        break;
      case "month":
        result = result.filter(
          (contact) => new Date(contact.updated_at) >= oneMonthAgo
        );
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredContacts(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, searchQuery, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold">ALSS_TECH</span>
            <span>
              Usuário: <span className="text-blue-500">{user.email}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              Suporte
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-gray-800 hover:text-red-400"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-xl">
            <span className="text-gray-400">
              {user.phone || "Número não cadastrado"}
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">Seus contatos:</h1>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              className="pl-10 bg-gray-900 border-gray-800"
              placeholder="Pesquise por nome ou telefone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
              >
                {dateFilter === "all"
                  ? "Todos os contatos"
                  : dateFilter === "today"
                  ? "Contatos de hoje"
                  : dateFilter === "week"
                  ? "Contatos da semana"
                  : "Contatos do mês"}
                <ChevronDown className="ml-2" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem
                onSelect={() => setDateFilter("all")}
                className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
              >
                Todos os contatos
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDateFilter("today")}
                className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
              >
                Contatos de hoje
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDateFilter("week")}
                className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
              >
                Contatos da semana
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDateFilter("month")}
                className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
              >
                Contatos do mês
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={fetchContacts}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
          >
            <RotateCcw />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Primeira conversa</th>
                <th className="text-left p-4">Última conversa</th>
                <th className="text-left p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-800">
                  <td className="p-4">{contact.name}</td>
                  <td className="p-4">{formatPhoneNumber(contact.whatsapp)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={contact.bot_enabled}
                        onCheckedChange={(checked) =>
                          handleBotToggle(contact, checked)
                        }
                        className={cn(
                          "data-[state=checked]:bg-green-500",
                          "data-[state=checked]:border-green-500",
                          "data-[state=unchecked]:bg-gray-600",
                          "data-[state=unchecked]:border-gray-600"
                        )}
                      />
                      <span className="text-sm text-gray-400">
                        {contact.bot_enabled ? "Robô ligado" : "Robô desligado"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {format(new Date(contact.created_at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="p-4">
                    {format(new Date(contact.updated_at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          window.open(
                            `https://web.whatsapp.com/send?phone=${contact.whatsapp}`
                          );
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleDeleteClick(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            Mostrando {startIndex + 1}-
            {Math.min(endIndex, filteredContacts.length)} de{" "}
            {filteredContacts.length} contatos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="icon"
                onClick={() => goToPage(index + 1)}
                aria-label={`Ir para página ${index + 1}`}
                aria-current={currentPage === index + 1 ? "page" : undefined}
                className={
                  currentPage === index + 1
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                }
              >
                {index + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o contato {contactToDelete?.name}
                ? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
