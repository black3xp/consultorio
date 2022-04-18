<script>
import Aside from "../../Layout/Aside.svelte";
import Header from "../../Layout/Header.svelte";


    
</script>
<Aside />

<main class="admin-main">
    <Header />
    <section class="admin-content ">
        <div class="bg-dark m-b-30">
            <div class="container">
                <div class="row p-b-60 p-t-60">

                    <div class="col-md-6 text-white p-b-30">
                        <div class="media">
                            <div class="avatar avatar mr-3">
                                <div class="avatar-title bg-success rounded-circle mdi mdi-currency-usd  ">

                                </div>
                            </div>
                            <div class="media-body">
                                <h1>Facturación </h1>
                                <p class="opacity-75">
                                    Facturacion total de los pacientes
                                </p>
                            </div>
                        </div>

                    </div>
                    <div class="col-md-5 text-center m-b-30 ml-auto">
                        <div class="rounded text-white bg-white-translucent">
                            <div class="p-all-15">
                                <div class="row">
                                    <div class="col-md-6 my-2 m-md-0">
                                        <div class="text-overline    opacity-75">Monto recibido</div>
                                        <h3 class="m-0 text-success">$42,560</h3>
                                    </div>
                                    <div class="col-md-6 my-2 m-md-0">

                                        <div class="text-overline    opacity-75">Monto pendiente</div>
                                        <h3 class="m-0 text-danger">$1,520</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
        <div class="pull-up">
            <div class="container">
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row m-b-20">
                                    <div class="col-md-6 my-auto">
                                        <h4 class="m-0">Resumen</h4>
                                    </div>
                                    <div class="col-md-6 text-right my-auto">
                                        <div class="btn-group" role="group" aria-label="Basic example">
                                            <button type="button" class="btn btn-white shadow-none js-datepicker"><i class="mdi mdi-calendar"></i> Pick Date
                                            </button>

                                            <button type="button" class="btn btn-white shadow-none">All</button>
                                            <button type="button" class="btn btn-white shadow-none">Paid</button>
                                            <button type="button" class="btn btn-white shadow-none">UnPaid</button>
                                        </div>

                                    </div>
                                </div>
                                <div class="row ">
                                    <div class="col-md-12 p-0">

                                        <div class="table-responsive">
                                            <table class="table table-hover">
                                                <thead class="">
                                                <tr>
                                                    <th scope="col">#</th>
                                                    <th scope="col">Date</th>
                                                    <th scope="col">Invoice Number</th>
                                                    <th scope="col">Recipient</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Amount</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                
                                                <tr>
                                                    <td class="align-middle">
                                                        <div class="avatar avatar-xs ">
                                                            <span class="avatar-title bg-danger rounded-circle">S</span>
                                                        </div>
                                                    </td>
                                                    <td class="align-middle">12-Sept-2018</td>
                                                    <td class="align-middle">#987125</td>
                                                    <td class="align-middle">steve@atmos.com</td>
                                                    <td class="align-middle"><span class=" text-success"><i class="mdi mdi-check-circle "></i> Paid</span></td>
                                                    <td class="align-middle"><h6 class="text-danger m-0">-$5710</h6>
                                                    </td>
                                                    <td class="align-middle">
                                                        <div class="input-group ">
                                                            <div class="input-group-prepend">
                                                                <a class="btn btn-white" href="/light/invoice-single">View
                                                                    Invoice</a>
                                                                <button type="button" class="btn btn-white dropdown-toggle dropdown-toggle-split rounded-right" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                    <span class="sr-only">Toggle Dropdown</span>
                                                                </button>
                                                                <div class="dropdown-menu dropdown-menu-right">
                                                                    <a class="dropdown-item" href="#">Action</a>
                                                                    <a class="dropdown-item" href="#">Another action</a>
                                                                    <a class="dropdown-item" href="#">Something else
                                                                        here</a>
                                                                    <div role="separator" class="dropdown-divider"></div>
                                                                    <a class="dropdown-item" href="#">Separated link</a>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                    <div class="col-auto ml-auto">
                                        <div>
                                            <nav class="">
                                                <ul class="pagination">
                                                    <li class="page-item disabled">
                                                        <a class="page-link" href="#" tabindex="-1">Previous</a>
                                                    </li>
                                                    <li class="page-item active"><a class="page-link" href="#">1</a>
                                                    </li>
                                                    <li class="page-item ">
                                                        <a class="page-link" href="#">2 <span class="sr-only">(current)</span></a>
                                                    </li>
                                                    <li class="page-item"><a class="page-link" href="#">3</a></li>
                                                    <li class="page-item">
                                                        <a class="page-link" href="#">Next</a>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
</main>
